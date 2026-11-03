using Microsoft.EntityFrameworkCore;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public sealed class RentalRepository(AppDbContext db) : IRentalRepository
{
    public async Task<IReadOnlyList<Rental>> GetByCustomerAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        await db.Rentals.AsNoTracking()
            .Where(r => r.CustomerId == customerId)
            .Include(r => r.Item)
            .Include(r => r.LateFees)
            .OrderByDescending(r => r.StartDate).ThenByDescending(r => r.Id)
            .ToListAsync(cancellationToken);
}
