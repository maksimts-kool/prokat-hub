using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Repositories;

namespace ProkatHub.Api.Services;

public sealed class RentalService(IRentalRepository rentals) : IRentalService
{
    public async Task<IReadOnlyList<RentalDto>> GetForCustomerAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var customerRentals = await rentals.GetByCustomerAsync(customerId, cancellationToken);
        return customerRentals.Select(ToDto).ToList();
    }

    private static RentalDto ToDto(Rental rental) => new(
        rental.Id,
        rental.ItemId,
        rental.Item.Name,
        rental.Item.ImageUrl,
        rental.StartDate,
        rental.EndDate,
        rental.Days,
        rental.Status,
        rental.DailyPrice,
        rental.DiscountPercent,
        rental.TotalPrice,
        rental.Deposit,
        rental.LateFees.Sum(f => f.Amount),
        rental.CreatedAt);
}
