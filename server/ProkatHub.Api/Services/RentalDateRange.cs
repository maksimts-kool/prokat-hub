using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;

namespace ProkatHub.Api.Services;

/// <summary>Checks shared by every endpoint that takes a rental date range.</summary>
internal static class RentalDateRange
{
    /// <summary>Today's date in UTC.</summary>
    public static DateOnly Today(TimeProvider timeProvider) =>
        DateOnly.FromDateTime(timeProvider.GetUtcNow().UtcDateTime);

    /// <summary>Rejects a range that starts in the past or ends before it starts.</summary>
    /// <exception cref="RequestValidationException">The range is invalid.</exception>
    public static void EnsureBookable(DateOnly from, DateOnly to, DateOnly today)
    {
        if (from < today)
        {
            throw new RequestValidationException(new Dictionary<string, string[]>
            {
                [nameof(DateRangeQuery.From)] = [$"From must not be in the past (today is {today:yyyy-MM-dd})."],
            });
        }

        if (from > to)
        {
            throw new RequestValidationException(new Dictionary<string, string[]>
            {
                [nameof(DateRangeQuery.From)] = ["From must not be after To."],
            });
        }
    }
}
