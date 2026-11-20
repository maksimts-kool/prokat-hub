using Microsoft.IdentityModel.JsonWebTokens;

namespace ProkatHub.Api.Auth;

public static class AuthConstants
{
    /// <summary>Short claim names are kept as-is (inbound claim mapping is off).</summary>
    public const string RoleClaimType = "role";

    public const string NameClaimType = JwtRegisteredClaimNames.Name;

    /// <summary>Query parameter that carries the JWT for SignalR WebSocket connections.</summary>
    public const string AccessTokenQueryParameter = "access_token";

    /// <summary>SignalR hubs live under this path; only there is the token read from the query string.</summary>
    public const string HubPathPrefix = "/ws";
}
