using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default);
}
