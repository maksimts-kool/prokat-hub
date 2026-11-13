using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;
using ProkatHub.Tests.Support;

namespace ProkatHub.Tests.Services;

public class RentalQuoteTests
{
    private static readonly DateOnly Today = new(2026, 11, 13);

    private readonly IItemRepository _items = Substitute.For<IItemRepository>();
    private readonly IDiscountTierRepository _tiers = Substitute.For<IDiscountTierRepository>();
    private readonly RentalService _service;

    public RentalQuoteTests()
    {
        _service = new RentalService(
            Substitute.For<IRentalRepository>(), _items, _tiers, new PricingService(),
            new FixedTimeProvider(new DateTimeOffset(Today.ToDateTime(new TimeOnly(15, 0)), TimeSpan.Zero)));

        _items.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(new Item
        {
            Id = 1,
            Name = "DJI Mini 4 Pro",
            Brand = "DJI",
            Description = "Drone",
            DailyPrice = 45m,
            Deposit = 800m,
            Category = new Category { Id = 3, Name = "Drones", Slug = "drones" },
        });
        _tiers.GetAllAsync(Arg.Any<CancellationToken>()).Returns(
        [
            new DiscountTier { Name = "3+ days", MinDays = 3, Percent = 10m },
            new DiscountTier { Name = "7+ days", MinDays = 7, Percent = 20m },
        ]);
    }

    [Fact]
    public async Task Quote_uses_the_item_prices_and_the_tier_for_the_rental_length()
    {
        // 7 days × 45 € = 315 €, 20 % off = 63 €
        var quote = await _service.GetQuoteAsync(1, Today, Today.AddDays(6));

        Assert.Equal(1, quote.ItemId);
        Assert.Equal("DJI Mini 4 Pro", quote.ItemName);
        Assert.Equal(Today, quote.From);
        Assert.Equal(Today.AddDays(6), quote.To);
        Assert.Equal(7, quote.Days);
        Assert.Equal(45m, quote.DailyPrice);
        Assert.Equal(315m, quote.Subtotal);
        Assert.Equal(20m, quote.DiscountPercent);
        Assert.Equal(63m, quote.DiscountAmount);
        Assert.Equal(800m, quote.Deposit);
        Assert.Equal(252m, quote.TotalPrice);
    }

    [Fact]
    public async Task Short_rental_gets_no_discount()
    {
        var quote = await _service.GetQuoteAsync(1, Today.AddDays(1), Today.AddDays(2));

        Assert.Equal(2, quote.Days);
        Assert.Equal(0m, quote.DiscountPercent);
        Assert.Equal(90m, quote.TotalPrice);
    }

    [Fact]
    public async Task Unknown_item_is_not_found()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetQuoteAsync(99, Today, Today.AddDays(1)));
    }

    [Fact]
    public async Task Range_starting_in_the_past_is_rejected()
    {
        var error = await Assert.ThrowsAsync<RequestValidationException>(
            () => _service.GetQuoteAsync(1, Today.AddDays(-1), Today.AddDays(1)));

        Assert.Contains("From", error.Errors.Keys);
        await _items.DidNotReceiveWithAnyArgs().GetByIdAsync(default, default);
    }

    [Fact]
    public async Task Range_ending_before_it_starts_is_rejected()
    {
        await Assert.ThrowsAsync<RequestValidationException>(
            () => _service.GetQuoteAsync(1, Today.AddDays(3), Today.AddDays(1)));
    }
}
