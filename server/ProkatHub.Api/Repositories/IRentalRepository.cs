using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public interface IRentalRepository
{
    /// <summary>A customer's rentals, newest first, with item and late fees loaded.</summary>
    Task<IReadOnlyList<Rental>> GetByCustomerAsync(Guid customerId, CancellationToken cancellationToken = default);
}
