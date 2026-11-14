using FluentValidation.TestHelper;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Validation;

public class CatalogueRequestValidatorTests
{
    private static ItemRequest ValidItem(string? imageUrl = null) =>
        new(1, "Sony A7 IV", "Sony", "Full-frame camera body.", imageUrl, 25m, 300m, 10m);

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("gaming-consoles")]
    public void Blank_or_well_formed_slug_is_accepted(string? slug)
    {
        new CategoryRequestValidator().TestValidate(new CategoryRequest("Gaming consoles", slug, null))
            .ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("Gaming-Consoles")]
    [InlineData("gaming--consoles")]
    [InlineData("-gaming")]
    public void Malformed_slug_is_rejected(string slug)
    {
        new CategoryRequestValidator().TestValidate(new CategoryRequest("Gaming consoles", slug, null))
            .ShouldHaveValidationErrorFor(x => x.Slug)
            .Only();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("  ")]
    [InlineData("https://example.com/a7.jpg")]
    public void Blank_or_http_image_url_is_accepted(string? imageUrl)
    {
        new ItemRequestValidator().TestValidate(ValidItem(imageUrl)).ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("ftp://example.com/a7.jpg")]
    [InlineData("a7.jpg")]
    public void Other_image_urls_are_rejected(string imageUrl)
    {
        new ItemRequestValidator().TestValidate(ValidItem(imageUrl))
            .ShouldHaveValidationErrorFor(x => x.ImageUrl)
            .Only();
    }

    [Fact]
    public void Missing_item_fields_are_reported_per_field()
    {
        var result = new ItemRequestValidator().TestValidate(new ItemRequest(null, null!, null!, null!, null, null, null, null));

        result.ShouldHaveValidationErrorFor(x => x.CategoryId);
        result.ShouldHaveValidationErrorFor(x => x.Name);
        result.ShouldHaveValidationErrorFor(x => x.Brand);
        result.ShouldHaveValidationErrorFor(x => x.Description);
        result.ShouldHaveValidationErrorFor(x => x.DailyPrice);
        result.ShouldHaveValidationErrorFor(x => x.Deposit);
        result.ShouldHaveValidationErrorFor(x => x.LateFeePerDay);
        result.ShouldNotHaveValidationErrorFor(x => x.ImageUrl);
    }
}
