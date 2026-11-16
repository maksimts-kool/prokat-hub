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
            .Where(r => r.TakesAnyDay(from, to, today))
            .Select(r => (r.StartDate, EndDate: r.BlockedUntil(today)))
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

    public async Task<PagedResult<StaffRentalDto>> GetPageAsync(
        RentalListQuery query, CancellationToken cancellationToken = default)
    {
        var (page, totalCount) = await rentals.GetPageAsync(query, cancellationToken);
        return new PagedResult<StaffRentalDto>(
            page.Select(RentalMapper.ToStaffDto).ToList(), query.Page, query.PageSize, totalCount);
    }

    public async Task<RentalDto> ChangeStatusAsync(
        int rentalId, RentalStatus status, string? note, Guid userId, RentalActor actor,
        CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(now.UtcDateTime);

        await using var transaction = await rentals.BeginTransactionAsync(cancellationToken);
        var rental = await rentals.GetForStatusChangeAsync(rentalId, cancellationToken);

        // Another customer's rental looks the same as a missing one, so ids can't be probed.
        if (rental is null || (actor == RentalActor.Customer && rental.CustomerId != userId))
        {
            throw new NotFoundException($"Rental {rentalId} was not found.");
        }

        var from = rental.Status;
        var allowed = RentalStatusRules.AllowedActors(from, status);
        if (allowed == RentalActor.None)
        {
            throw new ConflictException($"Rental {rentalId} is {from} and can't be changed to {status}.");
        }

        if (!RentalStatusRules.CanChange(from, status, actor))
        {
            throw new ForbiddenException($"Only staff can change a rental from {from} to {status}.");
        }

        switch (status)
        {
            case RentalStatus.Issued:
                if (today < rental.StartDate)
                {
                    throw new ConflictException(
                        $"Rental {rentalId} starts on {rental.StartDate:yyyy-MM-dd} and can't be issued before then.");
                }

                if (today > rental.EndDate)
                {
                    throw new ConflictException(
                        $"Rental {rentalId} ended on {rental.EndDate:yyyy-MM-dd} without being picked up; cancel it instead.");
                }

                rental.IssuedAt = now;
                break;

            case RentalStatus.Returned:
                // The overdue process charges late days hourly; this adds the days it hasn't charged yet,
                // up to and including the day of return, so the fee is final.
                rental.ChargeLateDays(today, now);
                rental.ReturnedAt = now;
                break;
        }

        rental.Status = status;
        rental.StatusHistory.Add(new RentalStatusHistory
        {
            RentalId = rental.Id,
            FromStatus = from,
            ToStatus = status,
            ChangedAt = now,
            ChangedById = userId,
            Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
        });

        await rentals.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation("User {UserId} changed rental {RentalId} from {FromStatus} to {ToStatus}",
            userId, rentalId, from, status);

        return rental.ToDto();
    }

    private static NotFoundException ItemNotFound(int itemId) => new($"Item {itemId} was not found.");
}
