using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Repositories;

public interface IItemRepository
{
    /// <summary>Active items for one catalogue page, with their category loaded.</summary>
    Task<(IReadOnlyList<Item> Items, int TotalCount)> GetPageAsync(ItemListQuery query, CancellationToken cancellationToken = default);

    /// <summary>An active item with its category, or null.</summary>
    Task<Item?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>A tracked active item with its category, for changes; or null.</summary>
    Task<Item?> GetForUpdateAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// A tracked active item, or null. Its row stays locked (<c>SELECT … FOR UPDATE</c>) until the current
    /// transaction ends, so two bookings of the same item cannot check availability at the same time.
    /// </summary>
    Task<Item?> GetForBookingAsync(int id, CancellationToken cancellationToken = default);

    void Add(Item item);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
