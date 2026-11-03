using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface IItemService
{
    Task<PagedResult<ItemSummaryDto>> GetPageAsync(ItemListQuery query, CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is retired.</exception>
    Task<ItemDetailsDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}
