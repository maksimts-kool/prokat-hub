using Microsoft.EntityFrameworkCore.Storage;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Repositories;

public interface IRentalRepository
{
    /// <summary>A customer's rentals, newest first, with item and late fees loaded.</summary>
    Task<IReadOnlyList<Rental>> GetByCustomerAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// One page of all rentals, newest start date first, with item, customer and late fees loaded.
    /// Filters by <see cref="RentalListQuery.Status"/> and by the days the rental covers.
    /// </summary>
    Task<(IReadOnlyList<Rental> Rentals, int TotalCount)> GetPageAsync(
        RentalListQuery query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Issued and Overdue rentals whose end date is before <paramref name="today"/>, i.e. items that should
    /// have been returned, oldest end date first, with item, customer and late fees loaded.
    /// </summary>
    Task<IReadOnlyList<Rental>> GetOverdueAsync(DateOnly today, CancellationToken cancellationToken = default);

    /// <summary>
    /// The rental with its item and late fees, tracked and locked until the current transaction ends,
    /// so two status changes of the same rental run one after the other. Null when it does not exist.
    /// </summary>
    Task<Rental?> GetForStatusChangeAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Whether the item has a Booked, Issued or Overdue rental.</summary>
    Task<bool> HasOpenRentalsAsync(int itemId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Booked, Issued and Overdue rentals of the item that start on or before <paramref name="to"/>
    /// and end on or after <paramref name="from"/>. Issued and Overdue rentals are included whatever
    /// their end date, because the item is still out until it is returned.
    /// </summary>
    Task<IReadOnlyList<Rental>> GetBlockingAsync(
        int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);

    /// <summary>Starts a database transaction. Disposing it without committing rolls it back.</summary>
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);

    void Add(Rental rental);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
