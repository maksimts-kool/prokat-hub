using FluentValidation.TestHelper;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Validation;

public class ItemListQueryValidatorTests
{
    private readonly ItemListQueryValidator _validator = new();

    [Fact]
    public void Defaults_are_valid_and_sort_by_name()
    {
        var query = new ItemListQuery();

        _validator.TestValidate(query).ShouldNotHaveAnyValidationErrors();
        Assert.Equal(ItemSort.Name, query.NormalizedSort());
        Assert.Null(query.NormalizedSearch());
    }

    [Theory]
    [InlineData("name")]
    [InlineData("NAME_DESC")]
    [InlineData(" price ")]
    [InlineData("price_desc")]
    [InlineData("Popularity")]
    public void Known_sort_values_are_accepted_in_any_case(string sort)
    {
        _validator.TestValidate(new ItemListQuery { Sort = sort }).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Unknown_sort_value_is_rejected()
    {
        _validator.TestValidate(new ItemListQuery { Sort = "rating" })
            .ShouldHaveValidationErrorFor(x => x.Sort)
            .Only();
    }

    [Fact]
    public void Min_price_above_max_price_is_rejected()
    {
        _validator.TestValidate(new ItemListQuery { MinPrice = 50m, MaxPrice = 10m })
            .ShouldHaveValidationErrorFor(x => x.MinPrice)
            .WithErrorMessage("MinPrice must not be greater than MaxPrice.")
            .Only();
    }

    [Theory]
    [InlineData(0, 12)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void Page_and_page_size_out_of_range_are_rejected(int page, int pageSize)
    {
        Assert.False(_validator.TestValidate(new ItemListQuery { Page = page, PageSize = pageSize }).IsValid);
    }

    [Fact]
    public void Blank_search_is_ignored_and_text_is_trimmed()
    {
        Assert.Null(new ItemListQuery { Search = "   " }.NormalizedSearch());
        Assert.Equal("sony a7", new ItemListQuery { Search = "  sony a7 " }.NormalizedSearch());
    }

    [Fact]
    public void Both_dates_are_valid()
    {
        _validator.TestValidate(new ItemListQuery { From = new(2026, 12, 1), To = new(2026, 12, 7) })
            .ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void From_without_to_is_rejected()
    {
        _validator.TestValidate(new ItemListQuery { From = new(2026, 12, 1) })
            .ShouldHaveValidationErrorFor(x => x.To)
            .WithErrorMessage("To is required when From is given.")
            .Only();
    }

    [Fact]
    public void To_without_from_is_rejected()
    {
        _validator.TestValidate(new ItemListQuery { To = new(2026, 12, 1) })
            .ShouldHaveValidationErrorFor(x => x.From)
            .WithErrorMessage("From is required when To is given.")
            .Only();
    }

    [Fact]
    public void From_after_to_is_rejected()
    {
        _validator.TestValidate(new ItemListQuery { From = new(2026, 12, 7), To = new(2026, 12, 1) })
            .ShouldHaveValidationErrorFor(x => x.From)
            .WithErrorMessage("From must not be after To.")
            .Only();
    }

    [Fact]
    public void Range_longer_than_the_limit_is_rejected()
    {
        var from = new DateOnly(2026, 12, 1);
        _validator.TestValidate(new ItemListQuery { From = from, To = from.AddDays(DateRangeQuery.MaxDays) })
            .ShouldHaveValidationErrorFor(x => x.To)
            .Only();
    }
}
