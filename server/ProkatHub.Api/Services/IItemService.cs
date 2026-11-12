using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface IItemService
{
    Task<PagedResult<ItemSummaryDto>> GetPageAsync(ItemListQuery query, CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is retired.</exception>
    Task<ItemDetailsDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.RequestValidationException">The category does not exist.</exception>
    Task<ItemDetailsDto> CreateAsync(ItemRequest request, CancellationToken cancellationToken = default);

    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is retired.</exception>
    /// <exception cref="Infrastructure.RequestValidationException">The category does not exist.</exception>
    Task<ItemDetailsDto> UpdateAsync(int id, ItemRequest request, CancellationToken cancellationToken = default);

    /// <summary>Retires the item: it leaves the catalogue but stays in the rental history.</summary>
    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is already retired.</exception>
    /// <exception cref="Infrastructure.ConflictException">The item has Booked, Issued or Overdue rentals.</exception>
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Taken days of an item between two dates, and whether the whole range is free.</summary>
    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is retired.</exception>
    /// <exception cref="Infrastructure.RequestValidationException">The range is invalid or starts in the past.</exception>
    Task<ItemAvailabilityDto> GetAvailabilityAsync(int id, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}
