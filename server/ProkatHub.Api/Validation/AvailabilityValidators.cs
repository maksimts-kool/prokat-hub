using FluentValidation;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Validation;

/// <summary>
/// Rules for every query with a date range: both dates are required, <c>From</c> is not after <c>To</c>,
/// and the range is at most <see cref="DateRangeQuery.MaxDays"/> days long. Dates in the past are rejected
/// by the services, because that check depends on today's date.
/// </summary>
/// <remarks>
/// A base class rather than <c>Include()</c>, so the OpenAPI document also sees these rules
/// on queries that extend <see cref="DateRangeQuery"/>.
/// </remarks>
public abstract class DateRangeQueryValidatorBase<T> : AbstractValidator<T> where T : DateRangeQuery
{
    protected DateRangeQueryValidatorBase()
    {
        RuleFor(x => x.From).NotNull();
        RuleFor(x => x.To).NotNull();

        When(x => x.From.HasValue && x.To.HasValue, () =>
        {
            RuleFor(x => x.From)
                .LessThanOrEqualTo(x => x.To)
                .WithMessage("From must not be after To.");

            RuleFor(x => x.To)
                .Must((query, to) => to!.Value.DayNumber - query.From!.Value.DayNumber + 1 <= DateRangeQuery.MaxDays)
                .When(x => x.From <= x.To)
                .WithMessage($"The range must not be longer than {DateRangeQuery.MaxDays} days.");
        });
    }
}

public sealed class DateRangeQueryValidator : DateRangeQueryValidatorBase<DateRangeQuery>;
