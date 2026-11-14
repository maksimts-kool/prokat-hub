namespace ProkatHub.Api.Dtos;

public sealed record CategoryDto(int Id, string Name, string Slug, string? Description);

/// <summary>Body of <c>POST /api/categories</c> and <c>PUT /api/categories/{id}</c>.</summary>
/// <remarks>Rules: <see cref="Validation.CategoryRequestValidator"/>.</remarks>
/// <param name="Slug">URL name such as <c>gaming-consoles</c>. Made from the name when left empty.</param>
public sealed record CategoryRequest(string Name, string? Slug, string? Description)
{
    /// <summary>Lower-case letters and digits in groups separated by single hyphens.</summary>
    public const string SlugPattern = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
}
