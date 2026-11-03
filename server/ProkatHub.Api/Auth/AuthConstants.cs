using Microsoft.IdentityModel.JsonWebTokens;

namespace ProkatHub.Api.Auth;

public static class AuthConstants
{
    /// <summary>Short claim names are kept as-is (inbound claim mapping is off).</summary>
    public const string RoleClaimType = "role";

    public const string NameClaimType = JwtRegisteredClaimNames.Name;
}
