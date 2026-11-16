using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface IRentalService
{
    Task<IReadOnlyList<RentalDto>> GetForCustomerAsync(Guid customerId, CancellationToken cancellationToken = default);

    /// <summary>Price of renting an item for a date range, with the discount for its length and the deposit.</summary>
    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is retired.</exception>
    /// <exception cref="Infrastructure.RequestValidationException">The range is invalid or starts in the past.</exception>
    Task<RentalQuoteDto> GetQuoteAsync(int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);

    /// <summary>
    /// Books an item for a customer at the price <see cref="IPricingService"/> calculates. The availability check
    /// and the insert run in one transaction that holds a lock on the item, so the item cannot be booked twice.
    /// </summary>
    /// <exception cref="Infrastructure.NotFoundException">The item does not exist or is retired.</exception>
    /// <exception cref="Infrastructure.RequestValidationException">The range is invalid or starts in the past.</exception>
    /// <exception cref="Infrastructure.ConflictException">A Booked, Issued or Overdue rental takes one of the days.</exception>
    Task<RentalDto> CreateAsync(
        Guid customerId, int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);

    /// <summary>One page of all rentals for the staff desk.</summary>
    Task<PagedResult<StaffRentalDto>> GetPageAsync(RentalListQuery query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Moves a rental to <paramref name="status"/> if <see cref="RentalStatusRules"/> allows it for
    /// <paramref name="actor"/>, and records the change in the status history. Returning an item after its
    /// end date charges every late day that has not been charged yet.
    /// </summary>
    /// <param name="userId">The signed-in user, saved in the history. A customer may only change their own rentals.</param>
    /// <exception cref="Infrastructure.NotFoundException">The rental does not exist, or belongs to another customer.</exception>
    /// <exception cref="Infrastructure.ForbiddenException">The change exists, but not for <paramref name="actor"/>.</exception>
    /// <exception cref="Infrastructure.ConflictException">The rental can't move from its current status to <paramref name="status"/>, or can't be issued today.</exception>
    Task<RentalDto> ChangeStatusAsync(
        int rentalId, RentalStatus status, string? note, Guid userId, RentalActor actor,
        CancellationToken cancellationToken = default);
}
