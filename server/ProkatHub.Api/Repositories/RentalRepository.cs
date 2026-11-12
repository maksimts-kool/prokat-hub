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

    public Task<bool> HasOpenRentalsAsync(int itemId, CancellationToken cancellationToken = default) =>
        db.Rentals.AnyAsync(r => r.ItemId == itemId &&
            (r.Status == RentalStatus.Booked || r.Status == RentalStatus.Issued || r.Status == RentalStatus.Overdue),
            cancellationToken);

    public async Task<IReadOnlyList<Rental>> GetBlockingAsync(
        int itemId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default) =>
        await db.Rentals.AsNoTracking()
            .Where(r => r.ItemId == itemId && r.StartDate <= to &&
                ((r.Status == RentalStatus.Booked && r.EndDate >= from) ||
                 r.Status == RentalStatus.Issued || r.Status == RentalStatus.Overdue))
            .OrderBy(r => r.StartDate).ThenBy(r => r.Id)
            .ToListAsync(cancellationToken);
}
