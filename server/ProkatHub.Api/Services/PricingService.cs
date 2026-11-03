using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;

namespace ProkatHub.Api.Services;

public sealed class PricingService : IPricingService
{
    public RentalQuote Calculate(
        decimal dailyPrice,
        decimal deposit,
        DateOnly startDate,
        DateOnly endDate,
        IEnumerable<DiscountTier> discountTiers)
    {
        if (endDate < startDate)
        {
            throw new BadRequestException("The end date must be on or after the start date.");
        }

        var days = endDate.DayNumber - startDate.DayNumber + 1;
        var subtotal = dailyPrice * days;
        var discountPercent = discountTiers
            .Where(t => t.MinDays <= days)
            .Select(t => t.Percent)
            .DefaultIfEmpty(0m)
            .Max();
        var discountAmount = Math.Round(subtotal * discountPercent / 100m, 2, MidpointRounding.AwayFromZero);

        return new RentalQuote(days, dailyPrice, subtotal, discountPercent, discountAmount, subtotal - discountAmount, deposit);
    }
}
