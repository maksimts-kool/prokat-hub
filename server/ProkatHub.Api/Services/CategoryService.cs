using System.Text;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;

namespace ProkatHub.Api.Services;

public sealed class CategoryService(ICategoryRepository categories, ILogger<CategoryService> logger) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var all = await categories.GetAllAsync(cancellationToken);
        return all.Select(ToDto).ToList();
    }

    public async Task<CategoryDto> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        ToDto(await FindAsync(id, cancellationToken));

    public async Task<CategoryDto> CreateAsync(CategoryRequest request, CancellationToken cancellationToken = default)
    {
        var (name, slug, description) = await NormalizeAsync(request, exceptId: null, cancellationToken);
        var category = new Category { Name = name, Slug = slug, Description = description };

        categories.Add(category);
        await categories.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Created category {CategoryId} ({Slug})", category.Id, category.Slug);

        return ToDto(category);
    }

    public async Task<CategoryDto> UpdateAsync(int id, CategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await FindAsync(id, cancellationToken);
        (category.Name, category.Slug, category.Description) = await NormalizeAsync(request, id, cancellationToken);

        await categories.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Updated category {CategoryId}", id);

        return ToDto(category);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await FindAsync(id, cancellationToken);
        if (await categories.HasItemsAsync(id, cancellationToken))
        {
            throw new ConflictException($"Category {id} still has items. Move or remove them first.");
        }

        categories.Remove(category);
        await categories.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Deleted category {CategoryId}", id);
    }

    /// <summary>Turns a name into a URL slug, e.g. "Gaming consoles" into "gaming-consoles".</summary>
    public static string ToSlug(string name)
    {
        var slug = new StringBuilder(name.Length);
        foreach (var c in name.Trim().ToLowerInvariant())
        {
            if (c is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                slug.Append(c);
            }
            else if (slug.Length > 0 && slug[^1] != '-')
            {
                slug.Append('-');
            }
        }

        return slug.ToString().TrimEnd('-');
    }

    private async Task<Category> FindAsync(int id, CancellationToken cancellationToken) =>
        await categories.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Category {id} was not found.");

    private async Task<(string Name, string Slug, string? Description)> NormalizeAsync(
        CategoryRequest request, int? exceptId, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        var slug = string.IsNullOrWhiteSpace(request.Slug) ? ToSlug(name) : request.Slug.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        if (slug.Length == 0)
        {
            throw new RequestValidationException(new Dictionary<string, string[]>
            {
                [nameof(CategoryRequest.Slug)] = ["Slug is required when the name has no letters or digits."],
            });
        }

        var (nameTaken, slugTaken) = await categories.FindDuplicatesAsync(name, slug, exceptId, cancellationToken);
        if (nameTaken)
        {
            throw new ConflictException($"A category named '{name}' already exists.");
        }

        if (slugTaken)
        {
            throw new ConflictException($"A category with the slug '{slug}' already exists.");
        }

        return (name, slug, description);
    }

    private static CategoryDto ToDto(Category c) => new(c.Id, c.Name, c.Slug, c.Description);
}
