namespace ProkatHub.Api.Dtos;

/// <summary>Body of <c>POST /api/auth/register</c>. Rules: <see cref="Validation.RegisterRequestValidator"/>.</summary>
public sealed record RegisterRequest(string Email, string Password, string FullName);

/// <summary>Body of <c>POST /api/auth/login</c>. Rules: <see cref="Validation.LoginRequestValidator"/>.</summary>
public sealed record LoginRequest(string Email, string Password);

public sealed record UserDto(Guid Id, string Email, string FullName, IReadOnlyList<string> Roles);

public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserDto User);
