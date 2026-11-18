using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using ProkatHub.Worker.Api;

namespace ProkatHub.Tests.Worker;

public class ProkatHubApiClientTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 18, 10, 0, 0, TimeSpan.Zero);

    private readonly FakeApi _api = new();
    private readonly SettableTimeProvider _time = new(Now);
    private readonly AccessTokenCache _tokens;

    public ProkatHubApiClientTests() => _tokens = new AccessTokenCache(_time);

    // Each run gets a new typed client; the token cache is shared, like in the worker.
    private ProkatHubApiClient NewClient() => new(
        new HttpClient(_api) { BaseAddress = new Uri("http://api:8080/") },
        _tokens,
        Options.Create(new ProkatHubApiOptions
        {
            BaseUrl = "http://api:8080",
            Email = "service@prokathub.test",
            Password = "Service12345",
        }),
        NullLogger<ProkatHubApiClient>.Instance);

    [Fact]
    public async Task Logs_in_as_the_service_account_and_sends_the_token()
    {
        var overdue = await NewClient().GetOverdueRentalsAsync(CancellationToken.None);

        Assert.Equal(["POST /api/auth/login", "GET /api/rentals/overdue"], _api.Calls);
        Assert.Equal(new LoginRequest("service@prokathub.test", "Service12345"), _api.LoginBodies.Single());
        Assert.Equal("Bearer token-1", _api.AuthorizationHeaders.Single());
        Assert.Equal(new OverdueRental(5, "Sony A7 IV", new DateOnly(2026, 11, 15), "Issued"), Assert.Single(overdue));
    }

    [Fact]
    public async Task Reuses_the_token_across_runs_until_it_is_about_to_expire()
    {
        await NewClient().GetOverdueRentalsAsync(CancellationToken.None);
        _time.Now = Now.AddMinutes(50);
        await NewClient().MarkLateAsync(5, CancellationToken.None);

        Assert.Equal(1, _api.Logins);

        // The token expires after 60 minutes and is renewed within the last two.
        _time.Now = Now.AddMinutes(59);
        await NewClient().GetOverdueRentalsAsync(CancellationToken.None);

        Assert.Equal(2, _api.Logins);
        Assert.Equal(["Bearer token-1", "Bearer token-1", "Bearer token-2"], _api.AuthorizationHeaders);
    }

    [Fact]
    public async Task A_401_with_the_cached_token_logs_in_again_once_and_retries()
    {
        await NewClient().GetOverdueRentalsAsync(CancellationToken.None);
        _api.RejectedTokens.Add("token-1");

        var result = await NewClient().MarkLateAsync(5, CancellationToken.None);

        Assert.Equal(5, result.Id);
        Assert.Equal(2, _api.Logins);
        Assert.Equal(["Bearer token-1", "Bearer token-1", "Bearer token-2"], _api.AuthorizationHeaders);
    }

    [Fact]
    public async Task A_401_with_a_fresh_token_fails_without_logging_in_again()
    {
        _api.RejectAllTokens = true;

        var ex = await Assert.ThrowsAsync<ProkatHubApiException>(
            () => NewClient().GetOverdueRentalsAsync(CancellationToken.None));

        Assert.Equal(HttpStatusCode.Unauthorized, ex.StatusCode);
        Assert.True(ex.IsAuthError);
        Assert.Equal(1, _api.Logins);
    }

    [Fact]
    public async Task A_failed_login_throws_an_auth_error()
    {
        _api.LoginStatus = HttpStatusCode.Unauthorized;

        var ex = await Assert.ThrowsAsync<ProkatHubApiException>(
            () => NewClient().GetOverdueRentalsAsync(CancellationToken.None));

        Assert.True(ex.IsAuthError);
        Assert.Equal(["POST /api/auth/login"], _api.Calls);
    }

    [Fact]
    public async Task Error_responses_include_the_problem_details_in_the_message()
    {
        _api.MarkLateStatus = HttpStatusCode.Conflict;

        var ex = await Assert.ThrowsAsync<ProkatHubApiException>(
            () => NewClient().MarkLateAsync(5, CancellationToken.None));

        Assert.Equal(HttpStatusCode.Conflict, ex.StatusCode);
        Assert.False(ex.IsAuthError);
        Assert.Equal("POST /api/rentals/5/mark-late responded 409: Conflict Rental 5 is Returned.", ex.Message);
    }

    private sealed class SettableTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = now;

        public override DateTimeOffset GetUtcNow() => Now;
    }

    /// <summary>Answers the three endpoints the worker uses, like the API would.</summary>
    private sealed class FakeApi : HttpMessageHandler
    {
        public List<string> Calls { get; } = [];
        public List<string?> AuthorizationHeaders { get; } = [];
        public List<LoginRequest> LoginBodies { get; } = [];
        public HashSet<string> RejectedTokens { get; } = [];
        public bool RejectAllTokens { get; set; }
        public HttpStatusCode LoginStatus { get; set; } = HttpStatusCode.OK;
        public HttpStatusCode MarkLateStatus { get; set; } = HttpStatusCode.OK;
        public int Logins => LoginBodies.Count;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var path = request.RequestUri!.AbsolutePath;
            Calls.Add($"{request.Method} {path}");

            if (path == "/api/auth/login")
            {
                LoginBodies.Add((await request.Content!.ReadFromJsonAsync<LoginRequest>(cancellationToken))!);
                return LoginStatus != HttpStatusCode.OK
                    ? Problem(LoginStatus, "Unauthorized", "Wrong email or password.")
                    : Json(new { accessToken = $"token-{Logins}", expiresAt = Now.AddHours(1), user = new { } });
            }

            var authorization = request.Headers.Authorization?.ToString();
            AuthorizationHeaders.Add(authorization);
            if (RejectAllTokens || RejectedTokens.Contains(request.Headers.Authorization?.Parameter ?? ""))
            {
                return new HttpResponseMessage(HttpStatusCode.Unauthorized);
            }

            return path switch
            {
                "/api/rentals/overdue" => Json(new[]
                {
                    new { id = 5, itemName = "Sony A7 IV", endDate = "2026-11-15", status = "Issued", lateDays = 0 },
                }),
                "/api/rentals/5/mark-late" when MarkLateStatus != HttpStatusCode.OK =>
                    Problem(MarkLateStatus, "Conflict", "Rental 5 is Returned."),
                "/api/rentals/5/mark-late" => Json(new { id = 5, status = "Overdue", lateDays = 3, lateFeeTotal = 180m }),
                _ => new HttpResponseMessage(HttpStatusCode.NotFound),
            };
        }

        private static HttpResponseMessage Json(object body) => new(HttpStatusCode.OK) { Content = JsonContent.Create(body) };

        private static HttpResponseMessage Problem(HttpStatusCode status, string title, string detail) =>
            new(status) { Content = JsonContent.Create(new { title, detail, status = (int)status }) };
    }
}
