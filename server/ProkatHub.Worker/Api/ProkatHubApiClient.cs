using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace ProkatHub.Worker.Api;

/// <summary>The calls the worker makes to the API, as the Service account.</summary>
public interface IProkatHubApiClient
{
    /// <summary><c>GET /api/rentals/overdue</c>: Issued or Overdue rentals past their end date.</summary>
    Task<IReadOnlyList<OverdueRental>> GetOverdueRentalsAsync(CancellationToken cancellationToken);

    /// <summary><c>POST /api/rentals/{id}/mark-late</c>: marks the rental Overdue and brings its late fee up to date.</summary>
    Task<MarkLateResult> MarkLateAsync(int rentalId, CancellationToken cancellationToken);
}

/// <summary>
/// Typed <see cref="HttpClient"/> for the API. Its handler pipeline (registered in Program.cs) retries transient
/// failures with backoff, so this class only deals with the access token: it reuses the cached one, logs in when there
/// is none, and logs in again once when the API rejects a cached token with 401.
/// </summary>
public sealed class ProkatHubApiClient(
    HttpClient http,
    AccessTokenCache tokens,
    IOptions<ProkatHubApiOptions> options,
    ILogger<ProkatHubApiClient> logger) : IProkatHubApiClient
{
    public async Task<IReadOnlyList<OverdueRental>> GetOverdueRentalsAsync(CancellationToken cancellationToken)
    {
        using var response = await SendAuthorizedAsync(
            () => new HttpRequestMessage(HttpMethod.Get, "api/rentals/overdue"), cancellationToken);
        await EnsureSuccessAsync(response, "GET /api/rentals/overdue", cancellationToken);
        return await response.Content.ReadFromJsonAsync<List<OverdueRental>>(cancellationToken) ?? [];
    }

    public async Task<MarkLateResult> MarkLateAsync(int rentalId, CancellationToken cancellationToken)
    {
        using var response = await SendAuthorizedAsync(
            () => new HttpRequestMessage(HttpMethod.Post, $"api/rentals/{rentalId}/mark-late"), cancellationToken);
        await EnsureSuccessAsync(response, $"POST /api/rentals/{rentalId}/mark-late", cancellationToken);
        return await response.Content.ReadFromJsonAsync<MarkLateResult>(cancellationToken)
            ?? throw new ProkatHubApiException(response.StatusCode, $"mark-late for rental {rentalId} returned no body");
    }

    private async Task<HttpResponseMessage> SendAuthorizedAsync(
        Func<HttpRequestMessage> createRequest, CancellationToken cancellationToken)
    {
        var token = tokens.GetValidToken();
        var usedCachedToken = token is not null;
        token ??= await LogInAsync(cancellationToken);

        var response = await SendWithTokenAsync(createRequest(), token, cancellationToken);
        if (response.StatusCode != HttpStatusCode.Unauthorized || !usedCachedToken)
        {
            return response;
        }

        // The API no longer accepts the cached token, e.g. it restarted with a new signing key. Log in again once;
        // a 401 with the fresh token is returned as it is and fails the call.
        response.Dispose();
        logger.LogInformation("The API rejected the cached access token; logging in again");
        tokens.Clear();
        token = await LogInAsync(cancellationToken);
        return await SendWithTokenAsync(createRequest(), token, cancellationToken);
    }

    private async Task<HttpResponseMessage> SendWithTokenAsync(
        HttpRequestMessage request, string token, CancellationToken cancellationToken)
    {
        using (request)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return await http.SendAsync(request, cancellationToken);
        }
    }

    private async Task<string> LogInAsync(CancellationToken cancellationToken)
    {
        var account = options.Value;
        using var response = await http.PostAsJsonAsync(
            "api/auth/login", new LoginRequest(account.Email, account.Password), cancellationToken);
        await EnsureSuccessAsync(response, "POST /api/auth/login", cancellationToken);

        var login = await response.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken)
            ?? throw new ProkatHubApiException(response.StatusCode, "Login returned no body");
        tokens.Store(login);
        logger.LogInformation("Logged in as {Email}; token valid until {ExpiresAt:u}", account.Email, login.ExpiresAt);
        return login.AccessToken;
    }

    /// <summary>Throws <see cref="ProkatHubApiException"/> with the ProblemDetails title and detail for an error status.</summary>
    private static async Task EnsureSuccessAsync(
        HttpResponseMessage response, string call, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var message = $"{call} responded {(int)response.StatusCode}";
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (ReadProblem(body) is { } problem)
        {
            message += $": {problem}";
        }

        throw new ProkatHubApiException(response.StatusCode, message);
    }

    private static string? ReadProblem(string body)
    {
        try
        {
            using var json = JsonDocument.Parse(body);
            var root = json.RootElement;
            var parts = new[] { "title", "detail" }
                .Select(name => root.ValueKind == JsonValueKind.Object && root.TryGetProperty(name, out var value)
                    ? value.GetString()
                    : null)
                .Where(part => !string.IsNullOrWhiteSpace(part));
            var problem = string.Join(" ", parts);
            return problem.Length > 0 ? problem : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
