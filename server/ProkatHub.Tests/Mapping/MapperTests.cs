using ProkatHub.Api.Domain;
using ProkatHub.Api.Mapping;

namespace ProkatHub.Tests.Mapping;

public class MapperTests
{
    private static Item Camera() => new()
    {
        Id = 7,
        Name = "Sony A7 IV",
        Brand = "Sony",
        Description = "Full-frame camera body.",
        ImageUrl = "https://example.com/a7.jpg",
        CategoryId = 2,
        Category = new Category { Id = 2, Name = "Cameras", Slug = "cameras" },
        DailyPrice = 25m,
        Deposit = 300m,
        LateFeePerDay = 10m,
    };

    [Fact]
    public void Item_category_name_is_flattened()
    {
        var dto = Camera().ToDetailsDto();

        Assert.Equal("Cameras", dto.CategoryName);
        Assert.Equal(2, dto.CategoryId);
        Assert.Equal(10m, dto.LateFeePerDay);
    }

    [Fact]
    public void Rental_takes_item_fields_and_sums_late_fees()
    {
        var rental = new Rental
        {
            Id = 3,
            ItemId = 7,
            Item = Camera(),
            StartDate = new(2026, 12, 1),
            EndDate = new(2026, 12, 3),
            Status = RentalStatus.Overdue,
            LateFees = [new LateFee { Amount = 10m }, new LateFee { Amount = 12.5m }],
        };

        var dto = rental.ToDto();

        Assert.Equal("Sony A7 IV", dto.ItemName);
        Assert.Equal("https://example.com/a7.jpg", dto.ItemImageUrl);
        Assert.Equal(3, dto.Days);
        Assert.Equal(22.5m, dto.LateFeeTotal);
    }

    [Fact]
    public void User_without_email_maps_to_empty_email()
    {
        var dto = new AppUser { Id = Guid.NewGuid(), Email = null, FullName = "Overdue Worker" }.ToDto(["Service"]);

        Assert.Equal(string.Empty, dto.Email);
        Assert.Equal(["Service"], dto.Roles);
    }
}
