using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public interface IDiscountTierRepository
{
    /// <summary>All discount tiers, shortest rental length first.</summary>
    Task<IReadOnlyList<DiscountTier>> GetAllAsync(CancellationToken cancellationToken = default);
}
