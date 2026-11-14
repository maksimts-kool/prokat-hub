using FluentValidation.TestHelper;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Validation;

public class DateRangeQueryValidatorTests
{
    private readonly DateRangeQueryValidator _validator = new();

    [Fact]
    public void One_day_range_is_valid()
    {
        _validator.TestValidate(new DateRangeQuery { From = new(2026, 12, 1), To = new(2026, 12, 1) })
            .ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Both_dates_are_required()
    {
        var result = _validator.TestValidate(new DateRangeQuery());

        result.ShouldHaveValidationErrorFor(x => x.From);
        result.ShouldHaveValidationErrorFor(x => x.To);
        Assert.Equal(2, result.Errors.Count);
    }

    [Fact]
    public void From_after_to_is_rejected()
    {
        _validator.TestValidate(new DateRangeQuery { From = new(2026, 12, 5), To = new(2026, 12, 1) })
            .ShouldHaveValidationErrorFor(x => x.From)
            .WithErrorMessage("From must not be after To.")
            .Only();
    }

    [Fact]
    public void Range_longer_than_the_limit_is_rejected()
    {
        var from = new DateOnly(2026, 12, 1);

        _validator.TestValidate(new DateRangeQuery { From = from, To = from.AddDays(DateRangeQuery.MaxDays - 1) })
            .ShouldNotHaveAnyValidationErrors();
        _validator.TestValidate(new DateRangeQuery { From = from, To = from.AddDays(DateRangeQuery.MaxDays) })
            .ShouldHaveValidationErrorFor(x => x.To)
            .Only();
    }
}
