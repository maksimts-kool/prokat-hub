using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Dtos;

/// <param name="LateFeePerDay">Fee for each day the item is returned late, copied from the item when booking.</param>
/// <param name="LateDays">Late days charged so far.</param>
/// <param name="LateFeeTotal">Sum of the late fees charged so far: <paramref name="LateDays"/> × <paramref name="LateFeePerDay"/>.</param>
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
    decimal LateFeePerDay,
    int LateDays,
    decimal LateFeeTotal,
    DateTimeOffset CreatedAt);

/// <summary>Body of <c>POST /api/rentals</c>: the item and the days to book, e.g. <c>{ "itemId": 1, "from": "2026-12-01", "to": "2026-12-07" }</c>.</summary>
/// <remarks>
/// Uses the same field names as the quote, so a client can book exactly what it priced.
/// The price is always calculated on the server. Rules: <see cref="Validation.CreateRentalRequestValidator"/>.
/// </remarks>
public sealed record CreateRentalRequest : DateRangeQuery
{
    /// <summary>Item to book.</summary>
    public int? ItemId { get; init; }
}

/// <summary>Query of <c>GET /api/rentals/quote</c>, e.g. <c>?itemId=1&amp;from=2026-12-01&amp;to=2026-12-07</c>.</summary>
/// <remarks>Rules: <see cref="Validation.RentalQuoteQueryValidator"/>.</remarks>
public sealed record RentalQuoteQuery : DateRangeQuery
{
    /// <summary>Item to price.</summary>
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

/// <summary>Body of <c>PATCH /api/rentals/{id}/status</c>, e.g. <c>{ "status": "Issued", "note": "Serial checked" }</c>.</summary>
/// <remarks>Rules: <see cref="Validation.ChangeRentalStatusRequestValidator"/>; allowed changes: <see cref="RentalStatusRules"/>.</remarks>
public sealed record ChangeRentalStatusRequest
{
    /// <summary>New status: <c>Issued</c> or <c>Returned</c> (staff), or <c>Cancelled</c> (customer or staff).</summary>
    public RentalStatus? Status { get; init; }

    /// <summary>Optional note saved in the status history, e.g. the condition of a returned item.</summary>
    public string? Note { get; init; }
}

/// <summary>Query string of <c>GET /api/rentals</c>, e.g. <c>?status=Issued&amp;status=Overdue&amp;page=1</c>.</summary>
/// <remarks>Rules: <see cref="Validation.RentalListQueryValidator"/>.</remarks>
public sealed record RentalListQuery
{
    /// <summary>Only rentals in one of these statuses. Repeat the parameter for several; leave it out for all.</summary>
    public RentalStatus[]? Status { get; init; }

    /// <summary>Only rentals that end on or after this day.</summary>
    public DateOnly? From { get; init; }

    /// <summary>Only rentals that start on or before this day.</summary>
    public DateOnly? To { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}

/// <summary>A rental as staff see it: the customer's rental plus who booked it and when it was issued and returned.</summary>
/// <param name="LateFeePerDay">Fee for each day the item is returned late, copied from the item when booking.</param>
/// <param name="LateDays">Late days charged so far.</param>
/// <param name="LateFeeTotal">Sum of the late fees charged so far: <paramref name="LateDays"/> × <paramref name="LateFeePerDay"/>.</param>
public sealed record StaffRentalDto(
    int Id,
    int ItemId,
    string ItemName,
    string? ItemImageUrl,
    Guid CustomerId,
    string CustomerFullName,
    string? CustomerEmail,
    DateOnly StartDate,
    DateOnly EndDate,
    int Days,
    RentalStatus Status,
    decimal DailyPrice,
    decimal DiscountPercent,
    decimal TotalPrice,
    decimal Deposit,
    decimal LateFeePerDay,
    int LateDays,
    decimal LateFeeTotal,
    DateTimeOffset CreatedAt,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ReturnedAt);
