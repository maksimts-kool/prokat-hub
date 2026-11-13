using System.ComponentModel.DataAnnotations;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Tests.Dtos;

public class RentalQuoteQueryTests
{
    private static List<ValidationResult> Validate(RentalQuoteQuery query)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(query, new ValidationContext(query), results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void Item_and_both_dates_are_required()
    {
        var errors = Validate(new RentalQuoteQuery());

        Assert.Equal(3, errors.Count);
    }

    [Fact]
    public void Item_id_must_be_positive()
    {
        var errors = Validate(new RentalQuoteQuery { ItemId = 0, From = new(2026, 12, 1), To = new(2026, 12, 2) });

        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(RentalQuoteQuery.ItemId)));
    }

    [Fact]
    public void Date_range_rules_still_apply()
    {
        var errors = Validate(new RentalQuoteQuery { ItemId = 1, From = new(2026, 12, 5), To = new(2026, 12, 1) });

        Assert.Single(errors);
    }

    [Fact]
    public void Valid_query_has_no_errors()
    {
        Assert.Empty(Validate(new RentalQuoteQuery { ItemId = 1, From = new(2026, 12, 1), To = new(2026, 12, 7) }));
    }
}
