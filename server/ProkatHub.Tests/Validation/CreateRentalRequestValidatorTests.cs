using FluentValidation.TestHelper;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Validation;

public class CreateRentalRequestValidatorTests
{
    private readonly CreateRentalRequestValidator _validator = new();

    [Fact]
    public void Item_and_both_dates_are_required()
    {
        var result = _validator.TestValidate(new CreateRentalRequest());

        result.ShouldHaveValidationErrorFor(x => x.ItemId);
        result.ShouldHaveValidationErrorFor(x => x.From);
        result.ShouldHaveValidationErrorFor(x => x.To);
        Assert.Equal(3, result.Errors.Count);
    }

    [Fact]
    public void Item_id_must_be_positive()
    {
        _validator.TestValidate(new CreateRentalRequest { ItemId = -1, From = new(2026, 12, 1), To = new(2026, 12, 2) })
            .ShouldHaveValidationErrorFor(x => x.ItemId)
            .Only();
    }

    [Fact]
    public void From_must_not_be_after_to()
    {
        _validator.TestValidate(new CreateRentalRequest { ItemId = 1, From = new(2026, 12, 5), To = new(2026, 12, 1) })
            .ShouldHaveValidationErrorFor(x => x.From)
            .Only();
    }

    [Fact]
    public void Range_longer_than_the_limit_is_rejected()
    {
        var from = new DateOnly(2026, 12, 1);
        _validator.TestValidate(new CreateRentalRequest { ItemId = 1, From = from, To = from.AddDays(DateRangeQuery.MaxDays) })
            .ShouldHaveValidationErrorFor(x => x.To)
            .Only();
    }

    [Fact]
    public void Valid_request_has_no_errors()
    {
        _validator.TestValidate(new CreateRentalRequest { ItemId = 1, From = new(2026, 12, 1), To = new(2026, 12, 1) })
            .ShouldNotHaveAnyValidationErrors();
    }
}
