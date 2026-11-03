namespace ProkatHub.Api.Services;

/// <summary>Price breakdown for renting one item for a date range.</summary>
public sealed record RentalQuote(
    int Days,
    decimal DailyPrice,
    decimal Subtotal,
    decimal DiscountPercent,
    decimal DiscountAmount,
    decimal TotalPrice,
    decimal Deposit);
