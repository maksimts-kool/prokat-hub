namespace ProkatHub.Api.Dtos;

/// <summary>An inclusive range of rental days in the query string, e.g. <c>?from=2026-12-01&amp;to=2026-12-03</c>.</summary>
/// <remarks>Rules: <see cref="Validation.DateRangeQueryValidator"/>.</remarks>
public record DateRangeQuery
{
    /// <summary>Longest range that can be asked for at once.</summary>
    public const int MaxDays = 366;

    /// <summary>First day (inclusive).</summary>
    public DateOnly? From { get; init; }

    /// <summary>Last day (inclusive).</summary>
    public DateOnly? To { get; init; }
}

/// <summary>Days on which an item is already taken.</summary>
public sealed record BookedRangeDto(DateOnly StartDate, DateOnly EndDate);

/// <summary>Answer of <c>GET /api/items/{id}/availability</c>.</summary>
/// <param name="IsAvailable">True when no booked range overlaps <paramref name="From"/>–<paramref name="To"/>.</param>
/// <param name="BookedRanges">Taken ranges that overlap the requested range, earliest first.</param>
public sealed record ItemAvailabilityDto(
    int ItemId,
    DateOnly From,
    DateOnly To,
    bool IsAvailable,
    IReadOnlyList<BookedRangeDto> BookedRanges);
