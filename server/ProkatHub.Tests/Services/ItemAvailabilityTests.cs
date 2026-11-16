using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;
using ProkatHub.Tests.Support;

namespace ProkatHub.Tests.Services;

public class ItemAvailabilityTests
{
    private static readonly DateOnly Today = new(2026, 11, 12);

    private readonly IItemRepository _items = Substitute.For<IItemRepository>();
    private readonly IRentalRepository _rentals = Substitute.For<IRentalRepository>();
    private readonly ItemService _service;

    public ItemAvailabilityTests()
    {
        _service = new ItemService(
            _items, Substitute.For<ICategoryRepository>(), _rentals,
            new FixedTimeProvider(new DateTimeOffset(Today.ToDateTime(new TimeOnly(15, 0)), TimeSpan.Zero)),
            NullLogger<ItemService>.Instance);

        _items.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(new Item
        {
            Id = 1,
            Name = "Sony Alpha 7 IV",
            Brand = "Sony",
            Description = "Camera",
            Category = new Category { Id = 1, Name = "Cameras", Slug = "cameras" },
        });
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
    public async Task Range_without_rentals_is_available()
    {
        GivenBlocking();

        var result = await _service.GetAvailabilityAsync(1, Today, Today.AddDays(5));

        Assert.True(result.IsAvailable);
        Assert.Empty(result.BookedRanges);
    }

    [Fact]
    public async Task Overlapping_booking_makes_the_range_unavailable()
    {
        GivenBlocking(Rental(RentalStatus.Booked, 3, 6));

        var result = await _service.GetAvailabilityAsync(1, Today.AddDays(5), Today.AddDays(8));

        Assert.False(result.IsAvailable);
        var range = Assert.Single(result.BookedRanges);
        Assert.Equal(Today.AddDays(3), range.StartDate);
        Assert.Equal(Today.AddDays(6), range.EndDate);
    }

    [Fact]
    public async Task Overdue_item_stays_taken_until_today()
    {
        GivenBlocking(Rental(RentalStatus.Overdue, -6, -2));

        var today = await _service.GetAvailabilityAsync(1, Today, Today.AddDays(2));
        var tomorrow = await _service.GetAvailabilityAsync(1, Today.AddDays(1), Today.AddDays(2));

        Assert.False(today.IsAvailable);
        Assert.Equal(Today, Assert.Single(today.BookedRanges).EndDate);
        Assert.True(tomorrow.IsAvailable);
    }

    [Fact]
    public async Task Range_starting_in_the_past_is_a_validation_error()
    {
        var error = await Assert.ThrowsAsync<RequestValidationException>(
            () => _service.GetAvailabilityAsync(1, Today.AddDays(-1), Today.AddDays(2)));

        Assert.Contains(nameof(DateRangeQuery.From), error.Errors.Keys);
    }

    [Fact]
    public async Task Unknown_item_throws_not_found()
    {
        _items.GetByIdAsync(42, Arg.Any<CancellationToken>()).Returns((Item?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetAvailabilityAsync(42, Today, Today));
    }

    [Theory]
    [InlineData(RentalStatus.Booked, true)]
    [InlineData(RentalStatus.Issued, true)]
    [InlineData(RentalStatus.Overdue, true)]
    [InlineData(RentalStatus.Returned, false)]
    [InlineData(RentalStatus.Cancelled, false)]
    public void Only_booked_issued_and_overdue_rentals_block_the_item(RentalStatus status, bool blocks)
    {
        Assert.Equal(blocks, status.BlocksItem());
    }
}
