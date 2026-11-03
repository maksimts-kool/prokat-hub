using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface ITokenService
{
    AuthResponse CreateToken(AppUser user, IReadOnlyList<string> roles);
}
