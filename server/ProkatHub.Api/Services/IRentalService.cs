using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface IRentalService
{
    Task<IReadOnlyList<RentalDto>> GetForCustomerAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>Price of renting an item for a date range, with the discount for its length and the deposit.</summary>
    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is retired.</exception>
    /// <exception cref="Infrastructure.RequestValidationException">The range is invalid or starts in the past.</exception>
    Task<RentalQuoteDto> GetQuoteAsync(int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}
