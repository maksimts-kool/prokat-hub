using FluentValidation.TestHelper;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Validation;

public class PopularItemsQueryValidatorTests
{
    private readonly PopularItemsQueryValidator _validator = new();

    [Fact]
    public void No_dates_means_all_time()
    {
        _validator.TestValidate(new PopularItemsQuery()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Past_ranges_of_any_length_are_accepted()
    {
        _validator.TestValidate(new PopularItemsQuery { From = new(2024, 1, 1), To = new(2026, 11, 30), Top = 50 })
            .ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void One_date_without_the_other_is_rejected()
    {
        _validator.TestValidate(new PopularItemsQuery { From = new(2026, 11, 1) })
            .ShouldHaveValidationErrorFor(x => x.To);
        _validator.TestValidate(new PopularItemsQuery { To = new(2026, 11, 1) })
            .ShouldHaveValidationErrorFor(x => x.From);
    }

    [Fact]
    public void Reversed_range_is_rejected()
    {
        _validator.TestValidate(new PopularItemsQuery { From = new(2026, 11, 30), To = new(2026, 11, 1) })
            .ShouldHaveValidationErrorFor(x => x.From);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(51)]
    public void Top_outside_1_to_50_is_rejected(int top)
    {
        _validator.TestValidate(new PopularItemsQuery { Top = top }).ShouldHaveValidationErrorFor(x => x.Top);
    }
}
