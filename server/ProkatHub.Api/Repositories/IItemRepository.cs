using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Repositories;

public interface IItemRepository
{
    /// <summary>Active items for one catalogue page, with their category loaded.</summary>
    Task<(IReadOnlyList<Item> Items, int TotalCount)> GetPageAsync(ItemListQuery query, CancellationToken cancellationToken = default);

    /// <summary>An active item with its category, or null.</summary>
    Task<Item?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}
