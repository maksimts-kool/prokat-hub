using System.ComponentModel.DataAnnotations;

namespace ProkatHub.Api.Dtos;

/// <summary>An inclusive range of rental days in the query string, e.g. <c>?from=2026-12-01&amp;to=2026-12-03</c>.</summary>
public sealed record DateRangeQuery : IValidatableObject
{
    /// <summary>Longest range that can be asked for at once.</summary>
    public const int MaxDays = 366;

    /// <summary>First day (inclusive).</summary>
    [Required]
    public DateOnly? From { get; init; }

    /// <summary>Last day (inclusive).</summary>
    [Required]
    public DateOnly? To { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (From is not { } from || To is not { } to)
        {
            yield break;
        }

        if (from > to)
        {
            yield return new ValidationResult("From must not be after To.", [nameof(From), nameof(To)]);
        }
        else if (to.DayNumber - from.DayNumber + 1 > MaxDays)
        {
            yield return new ValidationResult($"The range must not be longer than {MaxDays} days.", [nameof(To)]);
        }
    }
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
