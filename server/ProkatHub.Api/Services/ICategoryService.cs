using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.NotFoundException">The category does not exist.</exception>
    Task<CategoryDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.ConflictException">The name or slug is already used.</exception>
    Task<CategoryDto> CreateAsync(CategoryRequest request, CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.NotFoundException">The category does not exist.</exception>
    /// <exception cref="Infrastructure.ConflictException">The name or slug is already used by another category.</exception>
    Task<CategoryDto> UpdateAsync(int id, CategoryRequest request, CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.NotFoundException">The category does not exist.</exception>
    /// <exception cref="Infrastructure.ConflictException">The category still has items.</exception>
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
