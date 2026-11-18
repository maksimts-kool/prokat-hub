using System.ComponentModel.DataAnnotations;

namespace ProkatHub.Worker.Api;

/// <summary>Where the API is and which account the worker logs in with ("Api" section).</summary>
public sealed class ProkatHubApiOptions
{
    public const string SectionName = "Api";

    /// <summary>The API's base address, e.g. <c>http://api:8080</c> inside Docker Compose.</summary>
    [Required, Url]
    public string BaseUrl { get; set; } = "";

    /// <summary>The Service account's email.</summary>
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    /// <summary>The Service account's password (from the environment or user secrets, never appsettings).</summary>
    [Required]
    public string Password { get; set; } = "";
}
