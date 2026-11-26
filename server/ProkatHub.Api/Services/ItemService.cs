using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Mapping;
using ProkatHub.Api.Repositories;

namespace ProkatHub.Api.Services;

public sealed class ItemService(
    IItemRepository items,
    ICategoryRepository categories,
    IRentalRepository rentals,
    TimeProvider timeProvider,
    ILogger<ItemService> logger) : IItemService
{
    public async Task<PagedResult<ItemSummaryDto>> GetPageAsync(ItemListQuery query, CancellationToken cancellationToken = default)
    {
        var dates = query.DateRange();
        var today = RentalDateRange.Today(timeProvider);
        if (dates is { } range)
        {
            RentalDateRange.EnsureBookable(range.From, range.To, today);
        }

        var (page, totalCount) = await items.GetPageAsync(query, cancellationToken);

        // Without dates there is nothing to check, and IsAvailable stays null.
        IReadOnlySet<int>? taken = dates is { } days && page.Count > 0
            ? await rentals.GetTakenItemIdsAsync(page.Select(i => i.Id).ToList(), days.From, days.To, today, cancellationToken)
            : null;

        var result = page
            .Select(i => i.ToSummaryDto(dates is null ? null : taken?.Contains(i.Id) != true))
            .ToList();
        return new PagedResult<ItemSummaryDto>(result, query.Page, query.PageSize, totalCount);
    }

    public async Task<ItemDetailsDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var item = await items.GetByIdAsync(id, cancellationToken)
            ?? throw NotFound(id);

        return item.ToDetailsDto();
    }

    public async Task<ItemDetailsDto> CreateAsync(ItemRequest request, CancellationToken cancellationToken = default)
    {
        var item = new Item
        {
            Name = string.Empty,
            Brand = string.Empty,
            Description = string.Empty,
            CreatedAt = timeProvider.GetUtcNow(),
        };
        await ApplyAsync(item, request, cancellationToken);

        items.Add(item);
        await items.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Created item {ItemId} in category {CategoryId}", item.Id, item.CategoryId);

        return item.ToDetailsDto();
    }

    public async Task<ItemDetailsDto> UpdateAsync(int id, ItemRequest request, CancellationToken cancellationToken = default)
    {
        var item = await items.GetForUpdateAsync(id, cancellationToken) ?? throw NotFound(id);
        await ApplyAsync(item, request, cancellationToken);

        await items.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Updated item {ItemId}", id);

        return item.ToDetailsDto();
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var item = await items.GetForUpdateAsync(id, cancellationToken) ?? throw NotFound(id);
        if (await rentals.HasOpenRentalsAsync(id, cancellationToken))
        {
            throw new ConflictException(
                $"Item {id} has booked, issued or overdue rentals. Finish or cancel them before retiring the item.");
        }

        item.IsActive = false;
        await items.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Retired item {ItemId}", id);
    }

    public async Task<ItemAvailabilityDto> GetAvailabilityAsync(
        int id, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        var today = RentalDateRange.Today(timeProvider);
        RentalDateRange.EnsureBookable(from, to, today);

        _ = await items.GetByIdAsync(id, cancellationToken) ?? throw NotFound(id);

        var booked = (await rentals.GetBlockingAsync(id, from, to, cancellationToken))
            .Where(r => r.TakesAnyDay(from, to, today))
            .Select(r => new BookedRangeDto(r.StartDate, r.BlockedUntil(today)))
            .ToList();

        return new ItemAvailabilityDto(id, from, to, booked.Count == 0, booked);
    }

    private async Task ApplyAsync(Item item, ItemRequest request, CancellationToken cancellationToken)
    {
        // ItemRequestValidator guarantees these values before the service is called.
        var categoryId = request.CategoryId!.Value;
        if (item.CategoryId != categoryId)
        {
            item.Category = await categories.GetByIdAsync(categoryId, cancellationToken)
                ?? throw new RequestValidationException(new Dictionary<string, string[]>
                {
                    [nameof(ItemRequest.CategoryId)] = [$"Category {categoryId} does not exist."],
                });
            item.CategoryId = categoryId;
        }

        item.Name = request.Name.Trim();
        item.Brand = request.Brand.Trim();
        item.Description = request.Description.Trim();
        item.ImageUrls = (request.ImageUrls ?? []).Select(url => url.Trim()).ToList();
        item.DailyPrice = request.DailyPrice!.Value;
        item.Deposit = request.Deposit!.Value;
        item.LateFeePerDay = request.LateFeePerDay!.Value;
        item.Specifications = (request.Specifications ?? [])
            .Select(s => new ItemSpecification { Key = s.Key.Trim(), Value = s.Value.Trim() })
            .ToList();
    }

    private static NotFoundException NotFound(int id) => new($"Item {id} was not found.");
}
