using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Mapping;
using ProkatHub.Api.Repositories;

namespace ProkatHub.Api.Services;

public sealed class RentalService(
    IRentalRepository rentals,
    IItemRepository items,
    IDiscountTierRepository discountTiers,
    IPricingService pricing,
    TimeProvider timeProvider) : IRentalService
{
    public async Task<IReadOnlyList<RentalDto>> GetForCustomerAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var customerRentals = await rentals.GetByCustomerAsync(customerId, cancellationToken);
        return customerRentals.Select(RentalMapper.ToDto).ToList();
    }

    public async Task<RentalQuoteDto> GetQuoteAsync(
        int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        RentalDateRange.EnsureBookable(from, to, RentalDateRange.Today(timeProvider));

        var item = await items.GetByIdAsync(itemId, cancellationToken)
            ?? throw new NotFoundException($"Item {itemId} was not found.");
        var tiers = await discountTiers.GetAllAsync(cancellationToken);

        var quote = pricing.Calculate(item.DailyPrice, item.Deposit, from, to, tiers);

        return quote.ToDto(item.Id, item.Name, from, to);
    }
}
