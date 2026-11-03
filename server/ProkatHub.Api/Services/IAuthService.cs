using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface IAuthService
{
    /// <summary>Creates a Customer account and returns a token for it.</summary>
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<UserDto> GetUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
