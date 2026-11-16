using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;
using ProkatHub.Tests.Support;

namespace ProkatHub.Tests.Services;

public class RentalBookingTests
{
    private static readonly DateOnly Today = new(2026, 11, 15);
    private static readonly DateTimeOffset Now = new(Today.ToDateTime(new TimeOnly(15, 0)), TimeSpan.Zero);
    private static readonly Guid CustomerId = Guid.NewGuid();

    private readonly IRentalRepository _rentals = Substitute.For<IRentalRepository>();
    private readonly IItemRepository _items = Substitute.For<IItemRepository>();
    private readonly IDiscountTierRepository _tiers = Substitute.For<IDiscountTierRepository>();
    private readonly IDbContextTransaction _transaction = Substitute.For<IDbContextTransaction>();
    private readonly RentalService _service;

    public RentalBookingTests()
    {
        _service = new RentalService(
            _rentals, _items, _tiers, new PricingService(), new FixedTimeProvider(Now),
            NullLogger<RentalService>.Instance);

        _rentals.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(_transaction);
        _items.GetForBookingAsync(1, Arg.Any<CancellationToken>()).Returns(new Item
        {
            Id = 1,
            Name = "GoPro HERO13 Black",
            Brand = "GoPro",
            Description = "Action camera",
            ImageUrl = "https://example.test/gopro.png",
            DailyPrice = 20m,
            Deposit = 250m,
            LateFeePerDay = 30m,
        });
        _tiers.GetAllAsync(Arg.Any<CancellationToken>()).Returns(
        [
            new DiscountTier { Name = "3+ days", MinDays = 3, Percent = 10m },
            new DiscountTier { Name = "7+ days", MinDays = 7, Percent = 20m },
        ]);
        GivenBlocking();
    }

    private static Rental Rental(RentalStatus status, int startOffset, int endOffset) => new()
    {
        ItemId = 1,
        Status = status,
        StartDate = Today.AddDays(startOffset),
        EndDate = Today.AddDays(endOffset),
    };

    private void GivenBlocking(params Rental[] rentals) =>
        _rentals.GetBlockingAsync(1, Arg.Any<DateOnly>(), Arg.Any<DateOnly>(), Arg.Any<CancellationToken>())
            .Returns(rentals);

    [Fact]
    public async Task Booking_saves_a_rental_priced_on_the_server_and_commits()
    {
        // 4 days × 20 € = 80 €, 10 % off = 72 €
        var dto = await _service.CreateAsync(CustomerId, 1, Today.AddDays(2), Today.AddDays(5));

        _rentals.Received(1).Add(Arg.Is<Rental>(r =>
            r.ItemId == 1 &&
            r.CustomerId == CustomerId &&
            r.StartDate == Today.AddDays(2) &&
            r.EndDate == Today.AddDays(5) &&
            r.Status == RentalStatus.Booked &&
            r.DailyPrice == 20m &&
            r.DiscountPercent == 10m &&
            r.TotalPrice == 72m &&
            r.Deposit == 250m &&
            r.LateFeePerDay == 30m &&
            r.CreatedAt == Now));
        Received.InOrder(() =>
        {
            _rentals.SaveChangesAsync(Arg.Any<CancellationToken>());
            _transaction.CommitAsync(Arg.Any<CancellationToken>());
        });

        Assert.Equal("GoPro HERO13 Black", dto.ItemName);
        Assert.Equal("https://example.test/gopro.png", dto.ItemImageUrl);
        Assert.Equal(4, dto.Days);
        Assert.Equal(RentalStatus.Booked, dto.Status);
        Assert.Equal(72m, dto.TotalPrice);
        Assert.Equal(0m, dto.LateFeeTotal);
    }

    [Fact]
    public async Task Booking_records_the_first_status_history_entry()
    {
        await _service.CreateAsync(CustomerId, 1, Today, Today);

        _rentals.Received(1).Add(Arg.Is<Rental>(r =>
            r.StatusHistory.Count == 1 &&
            r.StatusHistory[0].FromStatus == null &&
            r.StatusHistory[0].ToStatus == RentalStatus.Booked &&
            r.StatusHistory[0].ChangedById == CustomerId &&
            r.StatusHistory[0].ChangedAt == Now));
    }

    [Fact]
    public async Task Item_is_locked_inside_the_transaction_before_availability_is_checked()
    {
        await _service.CreateAsync(CustomerId, 1, Today.AddDays(1), Today.AddDays(2));

        Received.InOrder(() =>
        {
            _rentals.BeginTransactionAsync(Arg.Any<CancellationToken>());
            _items.GetForBookingAsync(1, Arg.Any<CancellationToken>());
            _rentals.GetBlockingAsync(1, Today.AddDays(1), Today.AddDays(2), Arg.Any<CancellationToken>());
            _rentals.Add(Arg.Any<Rental>());
        });
    }

    [Theory]
    [InlineData(RentalStatus.Booked)]
    [InlineData(RentalStatus.Issued)]
    [InlineData(RentalStatus.Overdue)]
    public async Task Overlap_with_an_open_rental_is_a_conflict(RentalStatus status)
    {
        GivenBlocking(Rental(status, 3, 6));

        var error = await Assert.ThrowsAsync<ConflictException>(
            () => _service.CreateAsync(CustomerId, 1, Today.AddDays(6), Today.AddDays(9)));

        Assert.Contains($"{Today.AddDays(3):yyyy-MM-dd}–{Today.AddDays(6):yyyy-MM-dd}", error.Message);
        _rentals.DidNotReceive().Add(Arg.Any<Rental>());
        await _transaction.DidNotReceive().CommitAsync(Arg.Any<CancellationToken>());
        await _transaction.Received(1).DisposeAsync();
    }

    [Fact]
    public async Task Booking_right_after_another_rental_ends_is_allowed()
    {
        GivenBlocking(Rental(RentalStatus.Booked, 1, 3));

        await _service.CreateAsync(CustomerId, 1, Today.AddDays(4), Today.AddDays(5));

        _rentals.Received(1).Add(Arg.Any<Rental>());
    }

    [Fact]
    public async Task Booking_that_ends_the_day_before_another_rental_starts_is_allowed()
    {
        GivenBlocking(Rental(RentalStatus.Booked, 5, 8));

        await _service.CreateAsync(CustomerId, 1, Today.AddDays(2), Today.AddDays(4));

        _rentals.Received(1).Add(Arg.Any<Rental>());
    }

    [Theory]
    [InlineData(4, 5)] // inside the existing rental
    [InlineData(2, 9)] // around the existing rental
    [InlineData(3, 3)] // its first day only
    public async Task Contained_or_containing_range_is_a_conflict(int from, int to)
    {
        GivenBlocking(Rental(RentalStatus.Booked, 3, 6));

        await Assert.ThrowsAsync<ConflictException>(
            () => _service.CreateAsync(CustomerId, 1, Today.AddDays(from), Today.AddDays(to)));
        _rentals.DidNotReceive().Add(Arg.Any<Rental>());
    }

    [Theory]
    [InlineData(RentalStatus.Cancelled)]
    [InlineData(RentalStatus.Returned)]
    public async Task Cancelled_and_returned_rentals_do_not_block_the_same_days(RentalStatus status)
    {
        GivenBlocking(Rental(status, 3, 6));

        await _service.CreateAsync(CustomerId, 1, Today.AddDays(3), Today.AddDays(6));

        _rentals.Received(1).Add(Arg.Is<Rental>(r => r.StartDate == Today.AddDays(3)));
    }

    [Fact]
    public async Task Overdue_item_blocks_today_but_not_tomorrow()
    {
        GivenBlocking(Rental(RentalStatus.Overdue, -6, -2));

        await Assert.ThrowsAsync<ConflictException>(() => _service.CreateAsync(CustomerId, 1, Today, Today.AddDays(1)));
        await _service.CreateAsync(CustomerId, 1, Today.AddDays(1), Today.AddDays(2));

        _rentals.Received(1).Add(Arg.Is<Rental>(r => r.StartDate == Today.AddDays(1)));
    }

    [Fact]
    public async Task Unknown_or_retired_item_is_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _service.CreateAsync(CustomerId, 99, Today, Today));

        _rentals.DidNotReceive().Add(Arg.Any<Rental>());
        await _transaction.DidNotReceive().CommitAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Range_in_the_past_is_rejected_before_the_transaction_starts()
    {
        var error = await Assert.ThrowsAsync<RequestValidationException>(
            () => _service.CreateAsync(CustomerId, 1, Today.AddDays(-1), Today.AddDays(1)));

        Assert.Contains("From", error.Errors.Keys);
        await _rentals.DidNotReceive().BeginTransactionAsync(Arg.Any<CancellationToken>());
    }
}
