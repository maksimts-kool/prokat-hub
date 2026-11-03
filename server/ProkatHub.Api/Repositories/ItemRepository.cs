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

        var totalCount = await items.CountAsync(cancellationToken);
        var page = await items
            .Include(i => i.Category)
            .OrderBy(i => i.Name).ThenBy(i => i.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (page, totalCount);
    }

    public Task<Item?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Items.AsNoTracking()
            .Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.Id == id && i.IsActive, cancellationToken);
}
