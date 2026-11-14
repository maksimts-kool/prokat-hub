using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;

namespace ProkatHub.Tests.Services;

public class CategoryServiceTests
{
    private readonly ICategoryRepository _repository = Substitute.For<ICategoryRepository>();
    private readonly CategoryService _service;

    public CategoryServiceTests() => _service = new CategoryService(_repository, NullLogger<CategoryService>.Instance);

    [Theory]
    [InlineData("Gaming consoles", "gaming-consoles")]
    [InlineData("  VR & AR  headsets! ", "vr-ar-headsets")]
    [InlineData("4K TVs", "4k-tvs")]
    public void Slug_is_made_from_the_name(string name, string expected)
    {
        Assert.Equal(expected, CategoryService.ToSlug(name));
    }

    [Fact]
    public async Task Create_without_slug_uses_one_made_from_the_name()
    {
        _repository.FindDuplicatesAsync("Gaming consoles", "gaming-consoles", null, Arg.Any<CancellationToken>())
            .Returns((false, false));

        var result = await _service.CreateAsync(new CategoryRequest(" Gaming consoles ", null, " "));

        Assert.Equal("gaming-consoles", result.Slug);
        Assert.Null(result.Description);
        _repository.Received(1).Add(Arg.Is<Category>(c => c.Name == "Gaming consoles"));
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_with_a_name_in_use_is_a_conflict()
    {
        _repository.FindDuplicatesAsync("Cameras", "cameras", null, Arg.Any<CancellationToken>()).Returns((true, true));

        await Assert.ThrowsAsync<ConflictException>(() => _service.CreateAsync(new CategoryRequest("Cameras", null, null)));
        _repository.DidNotReceive().Add(Arg.Any<Category>());
    }

    [Fact]
    public async Task Update_ignores_the_category_itself_when_looking_for_duplicates()
    {
        var category = new Category { Id = 3, Name = "Audio", Slug = "audio" };
        _repository.GetByIdAsync(3, Arg.Any<CancellationToken>()).Returns(category);
        _repository.FindDuplicatesAsync("Audio gear", "audio", 3, Arg.Any<CancellationToken>()).Returns((false, false));

        var result = await _service.UpdateAsync(3, new CategoryRequest("Audio gear", "audio", "Mics"));

        Assert.Equal("Audio gear", category.Name);
        Assert.Equal("Mics", result.Description);
    }

    [Fact]
    public async Task Update_of_missing_category_throws_not_found()
    {
        _repository.GetByIdAsync(42, Arg.Any<CancellationToken>()).Returns((Category?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.UpdateAsync(42, new CategoryRequest("Audio", null, null)));
    }

    [Fact]
    public async Task Delete_of_category_with_items_is_a_conflict()
    {
        var category = new Category { Id = 1, Name = "Cameras", Slug = "cameras" };
        _repository.GetByIdAsync(1, Arg.Any<CancellationToken>()).Returns(category);
        _repository.HasItemsAsync(1, Arg.Any<CancellationToken>()).Returns(true);

        await Assert.ThrowsAsync<ConflictException>(() => _service.DeleteAsync(1));
        _repository.DidNotReceive().Remove(Arg.Any<Category>());
    }

    [Fact]
    public async Task Delete_removes_an_empty_category()
    {
        var category = new Category { Id = 8, Name = "Printers", Slug = "printers" };
        _repository.GetByIdAsync(8, Arg.Any<CancellationToken>()).Returns(category);
        _repository.HasItemsAsync(8, Arg.Any<CancellationToken>()).Returns(false);

        await _service.DeleteAsync(8);

        _repository.Received(1).Remove(category);
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
