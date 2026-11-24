namespace ProkatHub.Api.Dtos;

/// <summary>Query string of <c>GET /api/reports/popular-items</c>.</summary>
/// <remarks>Rules: <see cref="Validation.PopularItemsQueryValidator"/>.</remarks>
public sealed record PopularItemsQuery
{
    public const int DefaultTop = 10;
    public const int MaxTop = 50;

    /// <summary>First start day counted (inclusive). Give both dates or neither; without dates every rental counts.</summary>
    public DateOnly? From { get; init; }

    /// <summary>Last start day counted (inclusive).</summary>
    public DateOnly? To { get; init; }

    /// <summary>How many items to list, 1–50. Default 10.</summary>
    public int Top { get; init; } = DefaultTop;
}

/// <summary>One item of the popular items report.</summary>
/// <param name="IsRetired">The item has left the catalogue; its past rentals still count.</param>
/// <param name="RentalCount">Rentals of the item that start in the range, cancelled ones left out.</param>
/// <param name="RentalDays">Days those rentals cover.</param>
/// <param name="Revenue">The rentals' totals plus the late fees charged on them.</param>
/// <param name="LateFees">The late fee part of <paramref name="Revenue"/>.</param>
public sealed record PopularItemDto(
    int ItemId,
    string Name,
    string Brand,
    string CategoryName,
    bool IsRetired,
    int RentalCount,
    int RentalDays,
    decimal Revenue,
    decimal LateFees);

/// <summary>Answer of <c>GET /api/reports/popular-items</c>.</summary>
/// <param name="From">First start day counted; null for all time.</param>
/// <param name="To">Last start day counted; null for all time.</param>
/// <param name="TotalRentals">Rentals of every item in the range, not only the listed ones.</param>
/// <param name="TotalRevenue">Revenue of every item in the range, not only the listed ones.</param>
/// <param name="Items">The most rented items: most rentals first, then most revenue, then by name.</param>
public sealed record PopularItemsReportDto(
    DateOnly? From,
    DateOnly? To,
    int TotalRentals,
    decimal TotalRevenue,
    IReadOnlyList<PopularItemDto> Items);
