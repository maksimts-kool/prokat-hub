using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace ProkatHub.Api.Infrastructure;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id)
            ? id
            : throw new UnauthorizedException("The access token has no valid user id.");
}
