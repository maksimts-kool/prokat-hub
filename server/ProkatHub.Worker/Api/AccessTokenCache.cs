namespace ProkatHub.Worker.Api;

/// <summary>
/// Keeps the Service account's access token between runs, so the worker logs in only when the token is about to expire.
/// Registered as a singleton; the typed <see cref="ProkatHubApiClient"/> is created anew for each run.
/// </summary>
public sealed class AccessTokenCache(TimeProvider timeProvider)
{
    /// <summary>A token this close to its expiry is renewed instead of used, so it cannot expire mid-run.</summary>
    public static readonly TimeSpan RenewBefore = TimeSpan.FromMinutes(2);

    private LoginResponse? _token;

    /// <summary>The cached token, or <c>null</c> when there is none or it expires within <see cref="RenewBefore"/>.</summary>
    public string? GetValidToken() =>
        _token is { } token && token.ExpiresAt - RenewBefore > timeProvider.GetUtcNow() ? token.AccessToken : null;

    public void Store(LoginResponse token) => _token = token;

    public void Clear() => _token = null;
}
