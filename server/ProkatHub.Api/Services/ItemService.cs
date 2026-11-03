using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Repositories;

namespace ProkatHub.Api.Services;

public sealed class ItemService(IItemRepository items) : IItemService
{
    public async Task<PagedResult<ItemSummaryDto>> GetPageAsync(ItemListQuery query, CancellationToken cancellationToken = default)
    {
        var (page, totalCount) = await items.GetPageAsync(query, cancellationToken);
        return new PagedResult<ItemSummaryDto>(page.Select(ToSummary).ToList(), query.Page, query.PageSize, totalCount);
    }

    public async Task<ItemDetailsDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var item = await items.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Item {id} was not found.");

        return new ItemDetailsDto(
            item.Id, item.Name, item.Brand, item.Description, item.CategoryId, item.Category.Name,
            item.DailyPrice, item.Deposit, item.LateFeePerDay, item.ImageUrl);
    }

    private static ItemSummaryDto ToSummary(Item item) => new(
        item.Id, item.Name, item.Brand, item.CategoryId, item.Category.Name,
        item.DailyPrice, item.Deposit, item.ImageUrl);
}
