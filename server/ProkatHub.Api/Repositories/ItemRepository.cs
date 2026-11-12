using Microsoft.EntityFrameworkCore;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Repositories;

public sealed class ItemRepository(AppDbContext db) : IItemRepository
{
    public async Task<(IReadOnlyList<Item> Items, int TotalCount)> GetPageAsync(
        ItemListQuery query, CancellationToken cancellationToken = default)
    {
        var items = db.Items.AsNoTracking().Where(i => i.IsActive);

        if (query.NormalizedSearch is { } search)
        {
            var pattern = $"%{EscapeLikePattern(search)}%";
            items = items.Where(i =>
                EF.Functions.ILike(i.Name, pattern, @"\") ||
                EF.Functions.ILike(i.Brand, pattern, @"\") ||
                EF.Functions.ILike(i.Description, pattern, @"\"));
        }

        if (query.CategoryId is { } categoryId)
        {
            items = items.Where(i => i.CategoryId == categoryId);
        }

        if (query.MinPrice is { } minPrice)
        {
            items = items.Where(i => i.DailyPrice >= minPrice);
        }

        if (query.MaxPrice is { } maxPrice)
        {
            items = items.Where(i => i.DailyPrice <= maxPrice);
        }

        var totalCount = await items.CountAsync(cancellationToken);
        var page = await Sort(items, query.NormalizedSort)
            .Include(i => i.Category)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (page, totalCount);
    }

    public Task<Item?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Items.AsNoTracking()
            .Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.Id == id && i.IsActive, cancellationToken);

    public Task<Item?> GetForUpdateAsync(int id, CancellationToken cancellationToken = default) =>
        db.Items
            .Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.Id == id && i.IsActive, cancellationToken);

    public void Add(Item item) => db.Items.Add(item);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);

    // Every order ends with Id so that paging is stable when the main key ties.
    private static IQueryable<Item> Sort(IQueryable<Item> items, string sort) => sort switch
    {
        ItemSort.NameDesc => items.OrderByDescending(i => i.Name).ThenBy(i => i.Id),
        ItemSort.Price => items.OrderBy(i => i.DailyPrice).ThenBy(i => i.Name).ThenBy(i => i.Id),
        ItemSort.PriceDesc => items.OrderByDescending(i => i.DailyPrice).ThenBy(i => i.Name).ThenBy(i => i.Id),
        ItemSort.Popularity => items
            .OrderByDescending(i => i.Rentals.Count(r => r.Status != RentalStatus.Cancelled))
            .ThenBy(i => i.Name).ThenBy(i => i.Id),
        _ => items.OrderBy(i => i.Name).ThenBy(i => i.Id),
    };

    private static string EscapeLikePattern(string value) =>
        value.Replace(@"\", @"\\").Replace("%", @"\%").Replace("_", @"\_");
}
