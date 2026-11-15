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
    TimeProvider timeProvider,
    ILogger<RentalService> logger) : IRentalService
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

        var item = await items.GetByIdAsync(itemId, cancellationToken) ?? throw ItemNotFound(itemId);
        var tiers = await discountTiers.GetAllAsync(cancellationToken);

        var quote = pricing.Calculate(item.DailyPrice, item.Deposit, from, to, tiers);

        return quote.ToDto(item.Id, item.Name, from, to);
    }

    public async Task<RentalDto> CreateAsync(
        Guid customerId, int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        RentalDateRange.EnsureBookable(from, to, today);

        // Locking the item row makes concurrent bookings of the same item wait here one by one,
        // so each one sees the rentals the previous one committed. Disposing without commit rolls back.
        await using var transaction = await rentals.BeginTransactionAsync(cancellationToken);
        var item = await items.GetForBookingAsync(itemId, cancellationToken) ?? throw ItemNotFound(itemId);

        var taken = (await rentals.GetBlockingAsync(itemId, from, to, cancellationToken))
            .Select(r => (r.StartDate, EndDate: r.BlockedUntil(today)))
            .Where(r => r.StartDate <= to && r.EndDate >= from)
            .ToList();
        if (taken.Count > 0)
        {
            var ranges = string.Join(", ", taken.Select(r => $"{r.StartDate:yyyy-MM-dd}–{r.EndDate:yyyy-MM-dd}"));
            throw new ConflictException(
                $"Item {itemId} is already taken on some of the days from {from:yyyy-MM-dd} to {to:yyyy-MM-dd} ({ranges}).");
        }

        var tiers = await discountTiers.GetAllAsync(cancellationToken);
        var quote = pricing.Calculate(item.DailyPrice, item.Deposit, from, to, tiers);

        var rental = new Rental
        {
            ItemId = item.Id,
            Item = item,
            CustomerId = customerId,
            StartDate = from,
            EndDate = to,
            Status = RentalStatus.Booked,
            DailyPrice = quote.DailyPrice,
            DiscountPercent = quote.DiscountPercent,
            TotalPrice = quote.TotalPrice,
            Deposit = quote.Deposit,
            LateFeePerDay = item.LateFeePerDay,
            CreatedAt = now,
            StatusHistory =
            [
                new RentalStatusHistory { ToStatus = RentalStatus.Booked, ChangedAt = now, ChangedById = customerId },
            ],
        };
        rentals.Add(rental);
        await rentals.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation("Customer {CustomerId} booked item {ItemId} from {From} to {To} as rental {RentalId}",
            customerId, itemId, from, to, rental.Id);

        return rental.ToDto();
    }

    private static NotFoundException ItemNotFound(int itemId) => new($"Item {itemId} was not found.");
}
