using Microsoft.EntityFrameworkCore;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public sealed class DiscountTierRepository(AppDbContext db) : IDiscountTierRepository
{
    public async Task<IReadOnlyList<DiscountTier>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.DiscountTiers.AsNoTracking()
            .OrderBy(t => t.MinDays)
            .ToListAsync(cancellationToken);
}
