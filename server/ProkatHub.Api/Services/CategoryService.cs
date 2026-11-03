using ProkatHub.Api.Dtos;
using ProkatHub.Api.Repositories;

namespace ProkatHub.Api.Services;

public sealed class CategoryService(ICategoryRepository categories) : ICategoryService
{
    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var all = await categories.GetAllAsync(cancellationToken);
        return all.Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.Description)).ToList();
    }
}
