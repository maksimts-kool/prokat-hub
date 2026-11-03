using System.ComponentModel.DataAnnotations;

namespace ProkatHub.Api.Dtos;

public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password,
    [Required, MinLength(2), MaxLength(120)] string FullName);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record UserDto(Guid Id, string Email, string FullName, IReadOnlyList<string> Roles);

public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserDto User);
