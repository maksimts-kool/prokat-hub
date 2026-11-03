using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Services;

namespace ProkatHub.Tests.Services;

public class PricingServiceTests
{
    private static readonly DateOnly Start = new(2026, 11, 10);

    private static readonly DiscountTier[] Tiers =
    [
        new() { Name = "3+ days", MinDays = 3, Percent = 10m },
        new() { Name = "7+ days", MinDays = 7, Percent = 20m },
        new() { Name = "14+ days", MinDays = 14, Percent = 30m },
    ];

    private readonly PricingService _pricing = new();

    [Fact]
    public void Same_start_and_end_date_is_one_rental_day()
    {
        var quote = _pricing.Calculate(45m, 800m, Start, Start, Tiers);

        Assert.Equal(1, quote.Days);
        Assert.Equal(45m, quote.TotalPrice);
    }

    [Theory]
    [InlineData(2, 0)]
    [InlineData(3, 10)]
    [InlineData(6, 10)]
    [InlineData(7, 20)]
    [InlineData(13, 20)]
    [InlineData(14, 30)]
    [InlineData(30, 30)]
    public void Applies_the_discount_tier_reached_by_the_rental_length(int days, decimal expectedPercent)
    {
        var quote = _pricing.Calculate(10m, 100m, Start, Start.AddDays(days - 1), Tiers);

        Assert.Equal(days, quote.Days);
        Assert.Equal(expectedPercent, quote.DiscountPercent);
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
    public void Discount_is_rounded_to_cents()
    {
        // 3 days × 12.35 € = 37.05 €, 10 % = 3.705 € → 3.71 €
        var quote = _pricing.Calculate(12.35m, 0m, Start, Start.AddDays(2), Tiers);

        Assert.Equal(3.71m, quote.DiscountAmount);
        Assert.Equal(33.34m, quote.TotalPrice);
    }

    [Fact]
    public void No_tiers_means_no_discount()
    {
        var quote = _pricing.Calculate(20m, 0m, Start, Start.AddDays(9), []);

        Assert.Equal(0m, quote.DiscountPercent);
        Assert.Equal(200m, quote.TotalPrice);
    }

    [Fact]
    public void End_date_before_start_date_is_rejected()
    {
        Assert.Throws<BadRequestException>(() => _pricing.Calculate(20m, 0m, Start, Start.AddDays(-1), Tiers));
    }
}
