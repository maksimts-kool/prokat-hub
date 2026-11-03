using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface IRentalService
{
    Task<IReadOnlyList<RentalDto>> GetForCustomerAsync(Guid customerId, CancellationToken cancellationToken = default);
}
