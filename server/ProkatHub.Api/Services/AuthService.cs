using Microsoft.AspNetCore.Identity;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Mapping;

namespace ProkatHub.Api.Services;

public sealed class AuthService(
    UserManager<AppUser> userManager,
    ITokenService tokenService,
    TimeProvider timeProvider,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName.Trim(),
            CreatedAt = timeProvider.GetUtcNow(),
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code is nameof(IdentityErrorDescriber.DuplicateEmail) or nameof(IdentityErrorDescriber.DuplicateUserName)))
            {
                throw new ConflictException("An account with this email already exists.");
            }

            throw new RequestValidationException(ToValidationErrors(result.Errors));
        }

        await userManager.AddToRoleAsync(user, Roles.Customer);
        logger.LogInformation("Registered customer {UserId}", user.Id);

        return tokenService.CreateToken(user, [Roles.Customer]);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            logger.LogWarning("Login failed: no account with the given email");
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            logger.LogWarning("Login failed for user {UserId}: wrong password", user.Id);
            throw new UnauthorizedException("Invalid email or password.");
        }

        var roles = await userManager.GetRolesAsync(user);
        logger.LogInformation("User {UserId} logged in with roles {Roles}", user.Id, string.Join(",", roles));
        return tokenService.CreateToken(user, roles.ToList());
    }

    public async Task<UserDto> GetUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("The user no longer exists.");
        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles.ToList());
    }

    private static Dictionary<string, string[]> ToValidationErrors(IEnumerable<IdentityError> errors) =>
        errors
            .GroupBy(e => e.Code.StartsWith("Password", StringComparison.Ordinal)
                ? nameof(RegisterRequest.Password)
                : nameof(RegisterRequest.Email))
            .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
}
