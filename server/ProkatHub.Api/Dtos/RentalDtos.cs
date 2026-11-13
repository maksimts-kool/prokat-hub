using System.ComponentModel.DataAnnotations;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Dtos;

public sealed record RentalDto(
    int Id,
    int ItemId,
    string ItemName,
    string? ItemImageUrl,
    DateOnly StartDate,
    DateOnly EndDate,
    int Days,
    RentalStatus Status,
    decimal DailyPrice,
    decimal DiscountPercent,
    decimal TotalPrice,
    decimal Deposit,
    decimal LateFeeTotal,
    DateTimeOffset CreatedAt);

/// <summary>Query of <c>GET /api/rentals/quote</c>, e.g. <c>?itemId=1&amp;from=2026-12-01&amp;to=2026-12-07</c>.</summary>
public sealed record RentalQuoteQuery : DateRangeQuery
{
    /// <summary>Item to price.</summary>
    [Required]
    [Range(1, int.MaxValue)]
    public int? ItemId { get; init; }
}

/// <summary>Price of renting one item from <paramref name="From"/> to <paramref name="To"/> (both inclusive).</summary>
/// <param name="Days">Number of rental days.</param>
/// <param name="Subtotal">Daily price × days, before the discount.</param>
/// <param name="DiscountPercent">Percent of the best discount tier the rental length reaches, or 0.</param>
/// <param name="DiscountAmount">Subtotal × discount percent, rounded to cents.</param>
/// <param name="Deposit">Refundable deposit taken at pickup; not part of <paramref name="TotalPrice"/>.</param>
/// <param name="TotalPrice">Subtotal minus the discount.</param>
public sealed record RentalQuoteDto(
    int ItemId,
    string ItemName,
    DateOnly From,
    DateOnly To,
    int Days,
    decimal DailyPrice,
    decimal Subtotal,
    decimal DiscountPercent,
    decimal DiscountAmount,
    decimal Deposit,
    decimal TotalPrice);
