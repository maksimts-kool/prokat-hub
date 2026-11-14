using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public interface IRentalRepository
{
    /// <summary>A customer's rentals, newest first, with item and late fees loaded.</summary>
    Task<IReadOnlyList<Rental>> GetByCustomerAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>Whether the item has a Booked, Issued or Overdue rental.</summary>
    Task<bool> HasOpenRentalsAsync(int itemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Booked, Issued and Overdue rentals of the item that start on or before <paramref name="to"/>
    /// and end on or after <paramref name="from"/>. Issued and Overdue rentals are included whatever
    /// their end date, because the item is still out until it is returned.
    /// </summary>
    Task<IReadOnlyList<Rental>> GetBlockingAsync(
        int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}
