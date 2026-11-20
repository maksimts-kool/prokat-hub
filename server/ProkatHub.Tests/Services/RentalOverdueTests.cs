using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;
using ProkatHub.Tests.Support;

namespace ProkatHub.Tests.Services;

public class RentalOverdueTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);
    private static readonly DateTimeOffset Now = new(Today.ToDateTime(new TimeOnly(11, 30)), TimeSpan.Zero);
    private static readonly Guid ServiceId = Guid.NewGuid();

    private readonly IRentalRepository _rentals = Substitute.For<IRentalRepository>();
    private readonly IDbContextTransaction _transaction = Substitute.For<IDbContextTransaction>();
    private readonly IAvailabilityNotifier _availability = Substitute.For<IAvailabilityNotifier>();
    private readonly RentalService _service;

    public RentalOverdueTests()
    {
        _service = new RentalService(
            _rentals, Substitute.For<IItemRepository>(), Substitute.For<IDiscountTierRepository>(),
            new PricingService(), _availability, new FixedTimeProvider(Now), NullLogger<RentalService>.Instance);

        _rentals.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(_transaction);
    }

    private Rental GivenRental(RentalStatus status, int endOffset)
    {
        var rental = new Rental
        {
            Id = 5,
            ItemId = 1,
            Item = new Item { Id = 1, Name = "Sony A7 IV", Brand = "Sony", Description = "Camera" },
            Customer = new AppUser { FullName = "Mari Maasikas", Email = "mari@example.com" },
            Status = status,
            StartDate = Today.AddDays(endOffset - 2),
            EndDate = Today.AddDays(endOffset),
            DailyPrice = 40m,
            TotalPrice = 120m,
            // The item's late fee: daily price × 1.5.
            LateFeePerDay = 60m,
        };
        _rentals.GetForStatusChangeAsync(5, Arg.Any<CancellationToken>()).Returns(rental);
        return rental;
    }

    private async Task ShouldNotSave()
    {
        await _rentals.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        await _transaction.DidNotReceive().CommitAsync(Arg.Any<CancellationToken>());
        await _availability.DidNotReceiveWithAnyArgs().AvailabilityChangedAsync(default, default, default);
    }

    [Fact]
    public async Task Overdue_list_asks_for_rentals_past_today_and_maps_them_for_staff()
    {
        var rental = GivenRental(RentalStatus.Overdue, -2);
        rental.LateFees = [new LateFee { ChargeDate = Today.AddDays(-1), Amount = 60m }];
        _rentals.GetOverdueAsync(Today, Arg.Any<CancellationToken>()).Returns([rental]);

        var list = await _service.GetOverdueAsync();

        var dto = Assert.Single(list);
        Assert.Equal(5, dto.Id);
        Assert.Equal("Mari Maasikas", dto.CustomerFullName);
        Assert.Equal(RentalStatus.Overdue, dto.Status);
        Assert.Equal(1, dto.LateDays);
        Assert.Equal(60m, dto.LateFeeTotal);
    }

    [Fact]
    public async Task Mark_late_sets_overdue_records_it_and_charges_each_late_day()
    {
        var rental = GivenRental(RentalStatus.Issued, -3);

        var dto = await _service.MarkLateAsync(5, ServiceId);

        Assert.Equal(RentalStatus.Overdue, rental.Status);
        Assert.Equal(RentalStatus.Overdue, dto.Status);
        // Three days late × 40 € daily price × 1.5.
        Assert.Equal(3, dto.LateDays);
        Assert.Equal(180m, dto.LateFeeTotal);
        Assert.Equal(60m, dto.LateFeePerDay);
        Assert.Equal(
            [Today.AddDays(-2), Today.AddDays(-1), Today],
            rental.LateFees.Select(f => f.ChargeDate));
        var entry = Assert.Single(rental.StatusHistory);
        Assert.Equal(RentalStatus.Issued, entry.FromStatus);
        Assert.Equal(RentalStatus.Overdue, entry.ToStatus);
        Assert.Equal(ServiceId, entry.ChangedById);
        Assert.Equal(Now, entry.ChangedAt);
        Received.InOrder(() =>
        {
            _rentals.BeginTransactionAsync(Arg.Any<CancellationToken>());
            _rentals.GetForStatusChangeAsync(5, Arg.Any<CancellationToken>());
            _rentals.SaveChangesAsync(Arg.Any<CancellationToken>());
            _transaction.CommitAsync(Arg.Any<CancellationToken>());
        });
    }

    [Fact]
    public async Task Mark_late_on_the_first_late_day_charges_one_day()
    {
        var rental = GivenRental(RentalStatus.Issued, -1);

        var dto = await _service.MarkLateAsync(5, ServiceId);

        Assert.Equal(1, dto.LateDays);
        Assert.Equal(60m, dto.LateFeeTotal);
        Assert.Equal(Today, Assert.Single(rental.LateFees).ChargeDate);
    }

    [Fact]
    public async Task Calling_mark_late_again_recalculates_instead_of_charging_twice()
    {
        var rental = GivenRental(RentalStatus.Issued, -2);

        await _service.MarkLateAsync(5, ServiceId);
        var dto = await _service.MarkLateAsync(5, ServiceId);

        Assert.Equal(2, dto.LateDays);
        Assert.Equal(120m, dto.LateFeeTotal);
        Assert.Equal(2, rental.LateFees.Select(f => f.ChargeDate).Distinct().Count());
        // Only the first call changed the status.
        Assert.Single(rental.StatusHistory);
    }

    [Fact]
    public async Task Mark_late_on_an_overdue_rental_adds_only_the_new_days()
    {
        var rental = GivenRental(RentalStatus.Overdue, -3);
        var earlier = Now.AddDays(-1);
        rental.LateFees =
        [
            new LateFee { ChargeDate = Today.AddDays(-2), Amount = 60m, CreatedAt = earlier },
            new LateFee { ChargeDate = Today.AddDays(-1), Amount = 60m, CreatedAt = earlier },
        ];

        var dto = await _service.MarkLateAsync(5, ServiceId);

        Assert.Equal(RentalStatus.Overdue, dto.Status);
        Assert.Equal(3, dto.LateDays);
        Assert.Equal(180m, dto.LateFeeTotal);
        Assert.Equal(Now, rental.LateFees.Single(f => f.ChargeDate == Today).CreatedAt);
        Assert.All(rental.LateFees.Where(f => f.ChargeDate < Today), f => Assert.Equal(earlier, f.CreatedAt));
        Assert.Empty(rental.StatusHistory);
        await _transaction.Received(1).CommitAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2)]
    public async Task Rental_that_has_not_ended_is_not_late(int endOffset)
    {
        var rental = GivenRental(RentalStatus.Issued, endOffset);

        await Assert.ThrowsAsync<ConflictException>(() => _service.MarkLateAsync(5, ServiceId));
        Assert.Equal(RentalStatus.Issued, rental.Status);
        Assert.Empty(rental.LateFees);
        await ShouldNotSave();
    }

    [Theory]
    [InlineData(RentalStatus.Booked)]
    [InlineData(RentalStatus.Returned)]
    [InlineData(RentalStatus.Cancelled)]
    public async Task Only_issued_or_overdue_rentals_can_be_marked_late(RentalStatus status)
    {
        var rental = GivenRental(status, -3);

        await Assert.ThrowsAsync<ConflictException>(() => _service.MarkLateAsync(5, ServiceId));
        Assert.Equal(status, rental.Status);
        Assert.Empty(rental.LateFees);
        await ShouldNotSave();
    }

    [Fact]
    public async Task Unknown_rental_is_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _service.MarkLateAsync(99, ServiceId));
        await ShouldNotSave();
    }

    [Fact]
    public async Task Mark_late_announces_the_late_days_after_it_is_committed()
    {
        GivenRental(RentalStatus.Issued, -3);

        await _service.MarkLateAsync(5, ServiceId);

        Received.InOrder(() =>
        {
            _transaction.CommitAsync(Arg.Any<CancellationToken>());
            _availability.AvailabilityChangedAsync(1, Today.AddDays(-2), Today);
        });
    }

    [Fact]
    public async Task Mark_late_announces_a_new_late_day()
    {
        var rental = GivenRental(RentalStatus.Overdue, -2);
        rental.LateFees = [new LateFee { ChargeDate = Today.AddDays(-1), Amount = 60m }];

        await _service.MarkLateAsync(5, ServiceId);

        await _availability.Received(1).AvailabilityChangedAsync(1, Today.AddDays(-1), Today);
    }

    [Fact]
    public async Task Mark_late_again_on_the_same_day_announces_nothing_new()
    {
        GivenRental(RentalStatus.Issued, -2);

        await _service.MarkLateAsync(5, ServiceId);
        await _service.MarkLateAsync(5, ServiceId);

        // The hourly process calls it every hour; only the first call that day changed anything.
        await _availability.ReceivedWithAnyArgs(1).AvailabilityChangedAsync(default, default, default);
    }
}
