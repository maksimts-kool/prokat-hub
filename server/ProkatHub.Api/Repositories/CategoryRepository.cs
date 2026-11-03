using Microsoft.EntityFrameworkCore;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public sealed class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync(cancellationToken);
}
