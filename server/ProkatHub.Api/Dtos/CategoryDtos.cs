using System.ComponentModel.DataAnnotations;

namespace ProkatHub.Api.Dtos;

public sealed record CategoryDto(int Id, string Name, string Slug, string? Description);

/// <summary>Body of <c>POST /api/categories</c> and <c>PUT /api/categories/{id}</c>.</summary>
/// <param name="Slug">URL name such as <c>gaming-consoles</c>. Made from the name when left empty.</param>
public sealed record CategoryRequest(
    [Required, StringLength(100, MinimumLength = 2)] string Name,
    [StringLength(100), RegularExpression(CategoryRequest.SlugPattern,
        ErrorMessage = "Slug may contain only lower-case letters, digits and single hyphens.")] string? Slug,
    [StringLength(500)] string? Description)
{
    public const string SlugPattern = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
}
