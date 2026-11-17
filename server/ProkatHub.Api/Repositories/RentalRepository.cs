using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;

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

    public async Task<(IReadOnlyList<Rental> Rentals, int TotalCount)> GetPageAsync(
        RentalListQuery query, CancellationToken cancellationToken = default)
    {
        var rentals = db.Rentals.AsNoTracking();

        if (query.Status is { Length: > 0 } statuses)
        {
            rentals = rentals.Where(r => statuses.Contains(r.Status));
        }

        if (query.From is { } from)
        {
            rentals = rentals.Where(r => r.EndDate >= from);
        }

        if (query.To is { } to)
        {
            rentals = rentals.Where(r => r.StartDate <= to);
        }

        var totalCount = await rentals.CountAsync(cancellationToken);
        var page = await rentals
            .OrderByDescending(r => r.StartDate).ThenByDescending(r => r.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(r => r.Item)
            .Include(r => r.Customer)
            .Include(r => r.LateFees)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return (page, totalCount);
    }

    public async Task<IReadOnlyList<Rental>> GetOverdueAsync(DateOnly today, CancellationToken cancellationToken = default) =>
        await db.Rentals.AsNoTracking()
            .Where(r => (r.Status == RentalStatus.Issued || r.Status == RentalStatus.Overdue) && r.EndDate < today)
            .OrderBy(r => r.EndDate).ThenBy(r => r.Id)
            .Include(r => r.Item)
            .Include(r => r.Customer)
            .Include(r => r.LateFees)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

    public async Task<Rental?> GetForStatusChangeAsync(int id, CancellationToken cancellationToken = default)
    {
        var rental = await db.Rentals
            .FromSql($"""SELECT * FROM "Rentals" WHERE "Id" = {id} FOR UPDATE""")
            .FirstOrDefaultAsync(cancellationToken);
        if (rental is null)
        {
            return null;
        }

        // Loaded after the lock is taken, so the late fees can't change underneath.
        await db.Entry(rental).Reference(r => r.Item).LoadAsync(cancellationToken);
        await db.Entry(rental).Collection(r => r.LateFees).LoadAsync(cancellationToken);
        return rental;
    }

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

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default) =>
        db.Database.BeginTransactionAsync(cancellationToken);

    public void Add(Rental rental) => db.Rentals.Add(rental);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
