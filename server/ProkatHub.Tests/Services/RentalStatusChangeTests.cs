using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;
using ProkatHub.Tests.Support;

namespace ProkatHub.Tests.Services;

public class RentalStatusChangeTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);
    private static readonly DateTimeOffset Now = new(Today.ToDateTime(new TimeOnly(11, 30)), TimeSpan.Zero);
    private static readonly Guid CustomerId = Guid.NewGuid();
    private static readonly Guid StaffId = Guid.NewGuid();

    private readonly IRentalRepository _rentals = Substitute.For<IRentalRepository>();
    private readonly IDbContextTransaction _transaction = Substitute.For<IDbContextTransaction>();
    private readonly RentalService _service;

    public RentalStatusChangeTests()
    {
        _service = new RentalService(
            _rentals, Substitute.For<IItemRepository>(), Substitute.For<IDiscountTierRepository>(),
            new PricingService(), new FixedTimeProvider(Now), NullLogger<RentalService>.Instance);

        _rentals.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(_transaction);
    }

    private Rental GivenRental(RentalStatus status, int startOffset, int endOffset)
    {
        var rental = new Rental
        {
            Id = 5,
            ItemId = 1,
            Item = new Item { Id = 1, Name = "Sony A7 IV", Brand = "Sony", Description = "Camera" },
            CustomerId = CustomerId,
            Status = status,
            StartDate = Today.AddDays(startOffset),
            EndDate = Today.AddDays(endOffset),
            DailyPrice = 40m,
            TotalPrice = 120m,
            LateFeePerDay = 50m,
        };
        _rentals.GetForStatusChangeAsync(5, Arg.Any<CancellationToken>()).Returns(rental);
        return rental;
    }

    private async Task ShouldNotSave()
    {
        await _rentals.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        await _transaction.DidNotReceive().CommitAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Staff_issues_a_booked_rental_and_the_change_is_recorded()
    {
        var rental = GivenRental(RentalStatus.Booked, 0, 2);

        var dto = await _service.ChangeStatusAsync(5, RentalStatus.Issued, "  Serial checked ", StaffId, RentalActor.Staff);

        Assert.Equal(RentalStatus.Issued, dto.Status);
        Assert.Equal(RentalStatus.Issued, rental.Status);
        Assert.Equal(Now, rental.IssuedAt);
        var entry = Assert.Single(rental.StatusHistory);
        Assert.Equal(RentalStatus.Booked, entry.FromStatus);
        Assert.Equal(RentalStatus.Issued, entry.ToStatus);
        Assert.Equal(StaffId, entry.ChangedById);
        Assert.Equal(Now, entry.ChangedAt);
        Assert.Equal("Serial checked", entry.Note);
        Received.InOrder(() =>
        {
            _rentals.BeginTransactionAsync(Arg.Any<CancellationToken>());
            _rentals.GetForStatusChangeAsync(5, Arg.Any<CancellationToken>());
            _rentals.SaveChangesAsync(Arg.Any<CancellationToken>());
            _transaction.CommitAsync(Arg.Any<CancellationToken>());
        });
    }

    [Fact]
    public async Task Customer_cancels_their_own_booking()
    {
        var rental = GivenRental(RentalStatus.Booked, 3, 5);

        var dto = await _service.ChangeStatusAsync(5, RentalStatus.Cancelled, null, CustomerId, RentalActor.Customer);

        Assert.Equal(RentalStatus.Cancelled, dto.Status);
        var entry = Assert.Single(rental.StatusHistory);
        Assert.Equal(CustomerId, entry.ChangedById);
        Assert.Null(entry.Note);
        await _transaction.Received(1).CommitAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Customer_cannot_see_another_customers_rental()
    {
        GivenRental(RentalStatus.Booked, 3, 5);

        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.ChangeStatusAsync(5, RentalStatus.Cancelled, null, Guid.NewGuid(), RentalActor.Customer));
        await ShouldNotSave();
    }

    [Fact]
    public async Task Unknown_rental_is_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.ChangeStatusAsync(99, RentalStatus.Cancelled, null, StaffId, RentalActor.Staff));
        await ShouldNotSave();
    }

    [Theory]
    [InlineData(RentalStatus.Booked, RentalStatus.Issued)]
    [InlineData(RentalStatus.Issued, RentalStatus.Returned)]
    [InlineData(RentalStatus.Overdue, RentalStatus.Returned)]
    public async Task Customer_cannot_make_a_staff_only_change(RentalStatus from, RentalStatus to)
    {
        var rental = GivenRental(from, -1, 1);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.ChangeStatusAsync(5, to, null, CustomerId, RentalActor.Customer));
        Assert.Equal(from, rental.Status);
        await ShouldNotSave();
    }

    [Theory]
    [InlineData(RentalStatus.Booked, RentalStatus.Returned)]
    [InlineData(RentalStatus.Booked, RentalStatus.Booked)]
    [InlineData(RentalStatus.Issued, RentalStatus.Cancelled)]
    [InlineData(RentalStatus.Issued, RentalStatus.Overdue)]
    [InlineData(RentalStatus.Returned, RentalStatus.Issued)]
    [InlineData(RentalStatus.Cancelled, RentalStatus.Booked)]
    public async Task Invalid_change_is_a_conflict_even_for_staff(RentalStatus from, RentalStatus to)
    {
        var rental = GivenRental(from, -1, 1);

        var error = await Assert.ThrowsAsync<ConflictException>(
            () => _service.ChangeStatusAsync(5, to, null, StaffId, RentalActor.Staff));

        Assert.Contains($"is {from} and can't be changed to {to}", error.Message);
        Assert.Equal(from, rental.Status);
        Assert.Empty(rental.StatusHistory);
        await ShouldNotSave();
    }

    [Theory]
    [InlineData(1, 3)] // starts tomorrow
    [InlineData(-4, -1)] // ended yesterday without being picked up
    public async Task Rental_can_only_be_issued_between_its_start_and_end_date(int startOffset, int endOffset)
    {
        var rental = GivenRental(RentalStatus.Booked, startOffset, endOffset);

        await Assert.ThrowsAsync<ConflictException>(
            () => _service.ChangeStatusAsync(5, RentalStatus.Issued, null, StaffId, RentalActor.Staff));
        Assert.Equal(RentalStatus.Booked, rental.Status);
        Assert.Null(rental.IssuedAt);
        await ShouldNotSave();
    }

    [Fact]
    public async Task Returning_an_overdue_rental_charges_the_late_days_not_charged_yet()
    {
        // Ended 3 days ago; the overdue process already charged the first late day.
        var rental = GivenRental(RentalStatus.Overdue, -6, -3);
        rental.LateFees.Add(new LateFee { ChargeDate = Today.AddDays(-2), Amount = 50m });

        var dto = await _service.ChangeStatusAsync(5, RentalStatus.Returned, "Small scratch", StaffId, RentalActor.Staff);

        Assert.Equal(RentalStatus.Returned, dto.Status);
        Assert.Equal(Now, rental.ReturnedAt);
        Assert.Equal([Today.AddDays(-2), Today.AddDays(-1), Today], rental.LateFees.Select(f => f.ChargeDate).Order());
        Assert.Equal(150m, dto.LateFeeTotal);
        Assert.Equal(RentalStatus.Overdue, Assert.Single(rental.StatusHistory).FromStatus);
    }

    [Fact]
    public async Task Returning_on_time_charges_nothing()
    {
        var rental = GivenRental(RentalStatus.Issued, -2, 0);

        var dto = await _service.ChangeStatusAsync(5, RentalStatus.Returned, null, StaffId, RentalActor.Staff);

        Assert.Equal(RentalStatus.Returned, dto.Status);
        Assert.Empty(rental.LateFees);
        Assert.Equal(0m, dto.LateFeeTotal);
    }

    [Fact]
    public async Task Staff_list_is_paged_with_customer_details()
    {
        var query = new RentalListQuery { Status = [RentalStatus.Booked], Page = 2, PageSize = 1 };
        var rental = GivenRental(RentalStatus.Booked, 1, 2);
        rental.Customer = new AppUser { Id = CustomerId, FullName = "Mari Maasikas", Email = "mari@example.test" };
        _rentals.GetPageAsync(query, Arg.Any<CancellationToken>()).Returns(([rental], 3));

        var page = await _service.GetPageAsync(query);

        Assert.Equal(3, page.TotalCount);
        Assert.Equal(3, page.TotalPages);
        var dto = Assert.Single(page.Items);
        Assert.Equal("Mari Maasikas", dto.CustomerFullName);
        Assert.Equal("mari@example.test", dto.CustomerEmail);
        Assert.Equal("Sony A7 IV", dto.ItemName);
    }
}
