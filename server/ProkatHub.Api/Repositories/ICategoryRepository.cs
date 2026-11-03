using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken = default);
}
