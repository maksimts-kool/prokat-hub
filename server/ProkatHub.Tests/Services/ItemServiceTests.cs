using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;
using ProkatHub.Tests.Support;

namespace ProkatHub.Tests.Services;

public class ItemServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 12, 9, 30, 0, TimeSpan.Zero);

    private readonly IItemRepository _repository = Substitute.For<IItemRepository>();
    private readonly ICategoryRepository _categories = Substitute.For<ICategoryRepository>();
    private readonly IRentalRepository _rentals = Substitute.For<IRentalRepository>();
    private readonly ItemService _service;

    public ItemServiceTests() => _service = new ItemService(
        _repository, _categories, _rentals, new FixedTimeProvider(Now), NullLogger<ItemService>.Instance);

    private static Category Cameras() => new() { Id = 1, Name = "Cameras", Slug = "cameras" };

    private static Item Camera(int id) => new()
    {
        Id = id,
        Name = $"Camera {id}",
        Brand = "Sony",
        Description = "Mirrorless camera",
        CategoryId = 1,
        Category = Cameras(),
        DailyPrice = 45m,
        Deposit = 800m,
    };

    private static ItemRequest Request(int categoryId = 1) => new(
        categoryId, "  Sony ZV-E10 II ", "Sony", "Vlogging camera", ImageUrl: " ", 20m, 300m, 30m);

    [Fact]
    public async Task Page_passes_the_query_to_the_repository_and_maps_the_result()
    {
        var query = new ItemListQuery { Search = "sony", CategoryId = 1, Sort = "price", Page = 2, PageSize = 2 };
        _repository.GetPageAsync(query, Arg.Any<CancellationToken>())
            .Returns(([Camera(3), Camera(4)], 5));

        var result = await _service.GetPageAsync(query);

        await _repository.Received(1).GetPageAsync(query, Arg.Any<CancellationToken>());
        Assert.Equal([3, 4], result.Items.Select(i => i.Id));
        Assert.Equal("Cameras", result.Items[0].CategoryName);
        Assert.Equal(2, result.Page);
        Assert.Equal(2, result.PageSize);
        Assert.Equal(5, result.TotalCount);
        Assert.Equal(3, result.TotalPages);
    }

    [Fact]
    public async Task Missing_item_throws_not_found()
    {
        _repository.GetByIdAsync(42, Arg.Any<CancellationToken>()).Returns((Item?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetByIdAsync(42));
    }

    [Fact]
    public async Task Create_trims_the_fields_and_returns_the_new_item_with_its_category()
    {
        _categories.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(Cameras());

        var result = await _service.CreateAsync(Request());

        _repository.Received(1).Add(Arg.Is<Item>(i =>
            i.Name == "Sony ZV-E10 II" && i.CategoryId == 1 && i.ImageUrl == null && i.CreatedAt == Now && i.IsActive));
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        Assert.Equal("Cameras", result.CategoryName);
        Assert.Equal(20m, result.DailyPrice);
    }

    [Fact]
    public async Task Create_with_unknown_category_is_a_validation_error()
    {
        _categories.GetByIdAsync(99, Arg.Any<CancellationToken>()).Returns((Category?)null);

        var error = await Assert.ThrowsAsync<RequestValidationException>(() => _service.CreateAsync(Request(categoryId: 99)));

        Assert.Contains(nameof(ItemRequest.CategoryId), error.Errors.Keys);
        await _repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_of_missing_item_throws_not_found()
    {
        _repository.GetForUpdateAsync(42, Arg.Any<CancellationToken>()).Returns((Item?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.UpdateAsync(42, Request()));
    }

    [Fact]
    public async Task Delete_retires_the_item_instead_of_removing_it()
    {
        var camera = Camera(5);
        _repository.GetForUpdateAsync(5, Arg.Any<CancellationToken>()).Returns(camera);
        _rentals.HasOpenRentalsAsync(5, Arg.Any<CancellationToken>()).Returns(false);

        await _service.DeleteAsync(5);

        Assert.False(camera.IsActive);
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_of_item_with_open_rentals_is_a_conflict()
    {
        var camera = Camera(5);
        _repository.GetForUpdateAsync(5, Arg.Any<CancellationToken>()).Returns(camera);
        _rentals.HasOpenRentalsAsync(5, Arg.Any<CancellationToken>()).Returns(true);

        await Assert.ThrowsAsync<ConflictException>(() => _service.DeleteAsync(5));
        Assert.True(camera.IsActive);
    }
}
