using System.ComponentModel.DataAnnotations;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Tests.Dtos;

public class ItemListQueryTests
{
    private static List<ValidationResult> Validate(ItemListQuery query)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(query, new ValidationContext(query), results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void Defaults_are_valid_and_sort_by_name()
    {
        var query = new ItemListQuery();

        Assert.Empty(Validate(query));
        Assert.Equal(ItemSort.Name, query.NormalizedSort);
        Assert.Null(query.NormalizedSearch);
    }

    [Theory]
    [InlineData("name")]
    [InlineData("NAME_DESC")]
    [InlineData(" price ")]
    [InlineData("price_desc")]
    [InlineData("Popularity")]
    public void Known_sort_values_are_accepted_in_any_case(string sort)
    {
        Assert.Empty(Validate(new ItemListQuery { Sort = sort }));
    }

    [Fact]
    public void Unknown_sort_value_is_rejected()
    {
        var error = Assert.Single(Validate(new ItemListQuery { Sort = "rating" }));

        Assert.Contains(nameof(ItemListQuery.Sort), error.MemberNames);
    }

    [Fact]
    public void Min_price_above_max_price_is_rejected()
    {
        var error = Assert.Single(Validate(new ItemListQuery { MinPrice = 50m, MaxPrice = 10m }));

        Assert.Contains(nameof(ItemListQuery.MinPrice), error.MemberNames);
    }

    [Theory]
    [InlineData(0, 12)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void Page_and_page_size_out_of_range_are_rejected(int page, int pageSize)
    {
        Assert.NotEmpty(Validate(new ItemListQuery { Page = page, PageSize = pageSize }));
    }

    [Fact]
    public void Blank_search_is_ignored_and_text_is_trimmed()
    {
        Assert.Null(new ItemListQuery { Search = "   " }.NormalizedSearch);
        Assert.Equal("sony a7", new ItemListQuery { Search = "  sony a7 " }.NormalizedSearch);
    }
}
