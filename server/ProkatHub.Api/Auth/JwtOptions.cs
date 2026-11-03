using System.ComponentModel.DataAnnotations;

namespace ProkatHub.Api.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; set; } = string.Empty;

    [Required]
    public string Audience { get; set; } = string.Empty;

    /// <summary>HMAC-SHA256 key. Comes from .env / user secrets, never from appsettings.</summary>
    [Required, MinLength(32)]
    public string SigningKey { get; set; } = string.Empty;

    [Range(1, 24 * 60)]
    public int ExpiresMinutes { get; set; } = 60;
}
