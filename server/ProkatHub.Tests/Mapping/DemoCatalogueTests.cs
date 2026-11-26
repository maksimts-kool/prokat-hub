using System.Text.RegularExpressions;
using ProkatHub.Api.Data;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Mapping;

public class DemoCatalogueTests
{
    [Fact]
    public void Every_demo_item_has_specifications_with_valid_unique_keys()
    {
        var items = DemoCatalogue.Categories(DateTimeOffset.UnixEpoch).SelectMany(c => c.Items).ToList();

        Assert.All(items, item =>
        {
            Assert.NotEmpty(item.Specifications);
            Assert.All(item.Specifications, s => Assert.Matches(new Regex(ItemRequestValidator.SpecificationKeyPattern), s.Key));
            Assert.Equal(item.Specifications.Count, item.Specifications.Select(s => s.Key).Distinct().Count());
        });
    }

    [Fact]
    public void Every_demo_item_has_several_distinct_valid_photos()
    {
        var items = DemoCatalogue.Categories(DateTimeOffset.UnixEpoch).SelectMany(c => c.Items).ToList();

        Assert.All(items, item =>
        {
            Assert.InRange(item.ImageUrls.Count, 2, ItemRequestValidator.MaxImages);
            Assert.Equal(item.ImageUrls.Count, item.ImageUrls.Distinct().Count());
            Assert.All(item.ImageUrls, url => Assert.True(Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme == "https"));
        });
    }

    [Fact]
    public void Item_outside_the_demo_catalogue_gets_no_specifications()
    {
        Assert.Empty(DemoCatalogue.SpecificationsFor("Not a demo item"));
    }
}
