using FluentValidation.TestHelper;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Validation;

public class RentalQuoteQueryValidatorTests
{
    private readonly RentalQuoteQueryValidator _validator = new();

    [Fact]
    public void Item_and_both_dates_are_required()
    {
        var result = _validator.TestValidate(new RentalQuoteQuery());

        result.ShouldHaveValidationErrorFor(x => x.ItemId);
        result.ShouldHaveValidationErrorFor(x => x.From);
        result.ShouldHaveValidationErrorFor(x => x.To);
        Assert.Equal(3, result.Errors.Count);
    }

    [Fact]
    public void Item_id_must_be_positive()
    {
        _validator.TestValidate(new RentalQuoteQuery { ItemId = 0, From = new(2026, 12, 1), To = new(2026, 12, 2) })
            .ShouldHaveValidationErrorFor(x => x.ItemId)
            .Only();
    }

    [Fact]
    public void Date_range_rules_still_apply()
    {
        _validator.TestValidate(new RentalQuoteQuery { ItemId = 1, From = new(2026, 12, 5), To = new(2026, 12, 1) })
            .ShouldHaveValidationErrorFor(x => x.From)
            .Only();
    }

    [Fact]
    public void Valid_query_has_no_errors()
    {
        _validator.TestValidate(new RentalQuoteQuery { ItemId = 1, From = new(2026, 12, 1), To = new(2026, 12, 7) })
            .ShouldNotHaveAnyValidationErrors();
    }
}
