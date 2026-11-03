using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Services;

public interface IPricingService
{
    /// <summary>
    /// Calculates the price for renting from <paramref name="startDate"/> to <paramref name="endDate"/> (both inclusive),
    /// applying the best discount tier the rental length qualifies for.
    /// </summary>
    RentalQuote Calculate(
        decimal dailyPrice,
        decimal deposit,
        DateOnly startDate,
        DateOnly endDate,
        IEnumerable<DiscountTier> discountTiers);
}
