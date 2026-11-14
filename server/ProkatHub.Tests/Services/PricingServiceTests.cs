using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Services;

namespace ProkatHub.Tests.Services;

public class PricingServiceTests
{
    private static readonly DateOnly Start = new(2026, 11, 10);

    // Same tiers as the seeded demo catalogue.
    private static readonly DiscountTier[] Tiers =
    [
        new() { Name = "3+ days", MinDays = 3, Percent = 10m },
        new() { Name = "7+ days", MinDays = 7, Percent = 20m },
        new() { Name = "14+ days", MinDays = 14, Percent = 30m },
    ];

    private readonly PricingService _pricing = new();

    [Fact]
    public void One_day_rental_has_no_discount()
    {
        var quote = _pricing.Calculate(45m, 800m, Start, Start, Tiers);

        Assert.Equal(1, quote.Days);
        Assert.Equal(45m, quote.DailyPrice);
        Assert.Equal(45m, quote.Subtotal);
        Assert.Equal(0m, quote.DiscountPercent);
        Assert.Equal(0m, quote.DiscountAmount);
        Assert.Equal(45m, quote.TotalPrice);
        Assert.Equal(800m, quote.Deposit);
    }

    [Theory]
    [InlineData(2, 0, 20)]
    [InlineData(3, 10, 27)]
    [InlineData(6, 10, 54)]
    [InlineData(7, 20, 56)]
    [InlineData(13, 20, 104)]
    [InlineData(14, 30, 98)]
    [InlineData(30, 30, 210)]
    public void Applies_the_discount_tier_reached_by_the_rental_length(
        int days, decimal expectedPercent, decimal expectedTotal)
    {
        var quote = _pricing.Calculate(10m, 100m, Start, Start.AddDays(days - 1), Tiers);

        Assert.Equal(days, quote.Days);
        Assert.Equal(10m * days, quote.Subtotal);
        Assert.Equal(expectedPercent, quote.DiscountPercent);
        Assert.Equal(quote.Subtotal - expectedTotal, quote.DiscountAmount);
        Assert.Equal(expectedTotal, quote.TotalPrice);
    }

    [Fact]
    public void Total_is_subtotal_minus_discount_and_deposit_is_separate()
    {
        // 7 days × 45 € = 315 €, 20 % off = 63 €
        var quote = _pricing.Calculate(45m, 800m, Start, Start.AddDays(6), Tiers);

        Assert.Equal(315m, quote.Subtotal);
        Assert.Equal(63m, quote.DiscountAmount);
        Assert.Equal(252m, quote.TotalPrice);
        Assert.Equal(800m, quote.Deposit);
    }

    [Fact]
    public void Deposit_is_never_discounted()
    {
        // 14 days reaches the 30 % tier; the deposit stays as it is.
        var quote = _pricing.Calculate(45m, 800m, Start, Start.AddDays(13), Tiers);

        Assert.Equal(30m, quote.DiscountPercent);
        Assert.Equal(800m, quote.Deposit);
        Assert.Equal(441m, quote.TotalPrice);
    }

    [Fact]
    public void Discount_is_rounded_to_cents()
    {
        // 3 days × 12.35 € = 37.05 €, 10 % = 3.705 € → 3.71 €
        var quote = _pricing.Calculate(12.35m, 0m, Start, Start.AddDays(2), Tiers);

        Assert.Equal(3.71m, quote.DiscountAmount);
        Assert.Equal(33.34m, quote.TotalPrice);
    }

    [Fact]
    public void Tier_order_does_not_matter()
    {
        DiscountTier[] reversed = [Tiers[2], Tiers[1], Tiers[0]];

        var quote = _pricing.Calculate(10m, 0m, Start, Start.AddDays(13), reversed);

        Assert.Equal(30m, quote.DiscountPercent);
    }

    [Fact]
    public void No_tiers_means_no_discount()
    {
        var quote = _pricing.Calculate(20m, 0m, Start, Start.AddDays(9), []);

        Assert.Equal(0m, quote.DiscountPercent);
        Assert.Equal(200m, quote.TotalPrice);
    }

    [Fact]
    public void Range_across_the_new_year_counts_every_day()
    {
        // 30 Dec – 2 Jan inclusive = 4 days, enough for the 3+ days tier
        var quote = _pricing.Calculate(10m, 0m, new DateOnly(2026, 12, 30), new DateOnly(2027, 1, 2), Tiers);

        Assert.Equal(4, quote.Days);
        Assert.Equal(10m, quote.DiscountPercent);
        Assert.Equal(36m, quote.TotalPrice);
    }

    [Fact]
    public void End_date_before_start_date_is_rejected()
    {
        var error = Assert.Throws<BadRequestException>(
            () => _pricing.Calculate(20m, 0m, Start, Start.AddDays(-1), Tiers));

        Assert.Equal(400, error.StatusCode);
    }
}
