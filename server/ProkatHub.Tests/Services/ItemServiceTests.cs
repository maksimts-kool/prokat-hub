using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;

namespace ProkatHub.Tests.Services;

public class ItemServiceTests
{
    private readonly IItemRepository _repository = Substitute.For<IItemRepository>();
    private readonly ItemService _service;

    public ItemServiceTests() => _service = new ItemService(_repository);

    private static Item Camera(int id) => new()
    {
        Id = id,
        Name = $"Camera {id}",
        Brand = "Sony",
        Description = "Mirrorless camera",
        CategoryId = 1,
        Category = new Category { Id = 1, Name = "Cameras", Slug = "cameras" },
        DailyPrice = 45m,
        Deposit = 800m,
    };

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
}
