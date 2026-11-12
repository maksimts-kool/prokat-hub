using System.ComponentModel.DataAnnotations;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Tests.Dtos;

public class DateRangeQueryTests
{
    private static List<ValidationResult> Validate(DateRangeQuery query)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(query, new ValidationContext(query), results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void One_day_range_is_valid()
    {
        Assert.Empty(Validate(new DateRangeQuery { From = new(2026, 12, 1), To = new(2026, 12, 1) }));
    }

    [Fact]
    public void Both_dates_are_required()
    {
        var errors = Validate(new DateRangeQuery());

        Assert.Equal(2, errors.Count);
    }

    [Fact]
    public void From_after_to_is_rejected()
    {
        var error = Assert.Single(Validate(new DateRangeQuery { From = new(2026, 12, 5), To = new(2026, 12, 1) }));

        Assert.Contains(nameof(DateRangeQuery.From), error.MemberNames);
    }

    [Fact]
    public void Range_longer_than_the_limit_is_rejected()
    {
        var from = new DateOnly(2026, 12, 1);

        Assert.Empty(Validate(new DateRangeQuery { From = from, To = from.AddDays(DateRangeQuery.MaxDays - 1) }));
        Assert.Single(Validate(new DateRangeQuery { From = from, To = from.AddDays(DateRangeQuery.MaxDays) }));
    }
}
