using Microsoft.EntityFrameworkCore;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public sealed class ReportRepository(AppDbContext db) : IReportRepository
{
    public async Task<IReadOnlyList<ItemRentalStats>> GetItemRentalStatsAsync(
        DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default)
    {
        var rentals = db.Rentals.AsNoTracking().Where(r => r.Status != RentalStatus.Cancelled);
        if (from is { } first)
        {
            rentals = rentals.Where(r => r.StartDate >= first);
        }

        if (to is { } last)
        {
            rentals = rentals.Where(r => r.StartDate <= last);
        }

        // Three grouped queries the database sums up: rentals, their late fees, and the items' names.
        var perItem = await rentals
            .GroupBy(r => r.ItemId)
            .Select(g => new
            {
                ItemId = g.Key,
                Count = g.Count(),
                Days = g.Sum(r => r.EndDate.DayNumber - r.StartDate.DayNumber + 1),
                Total = g.Sum(r => r.TotalPrice),
            })
            .ToListAsync(cancellationToken);
        if (perItem.Count == 0)
        {
            return [];
        }

        var lateFees = await (
                from fee in db.LateFees
                join rental in rentals on fee.RentalId equals rental.Id
                group fee.Amount by rental.ItemId into g
                select new { ItemId = g.Key, Amount = g.Sum() })
            .ToDictionaryAsync(x => x.ItemId, x => x.Amount, cancellationToken);

        var ids = perItem.Select(x => x.ItemId).ToList();
        var items = await db.Items.AsNoTracking()
            .Where(i => ids.Contains(i.Id))
            .Select(i => new { i.Id, i.Name, i.Brand, CategoryName = i.Category.Name, i.IsActive })
            .ToDictionaryAsync(i => i.Id, cancellationToken);

        return perItem
            .Select(x =>
            {
                var item = items[x.ItemId];
                return new ItemRentalStats(
                    x.ItemId, item.Name, item.Brand, item.CategoryName, item.IsActive,
                    x.Count, x.Days, x.Total, lateFees.GetValueOrDefault(x.ItemId));
            })
            .ToList();
    }
}
