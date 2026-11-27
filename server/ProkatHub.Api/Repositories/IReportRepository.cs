namespace ProkatHub.Api.Repositories;

/// <summary>Rental totals of one item, retired or not.</summary>
public sealed record ItemRentalStats(
    int ItemId,
    string Name,
    string Brand,
    string CategoryName,
    bool IsActive,
    int RentalCount,
    int RentalDays,
    decimal RentalTotal,
    decimal LateFees);

public interface IReportRepository
{
    /// <summary>
    /// Totals per item of the rentals that are not cancelled and start between <paramref name="from"/> and
    /// <paramref name="to"/> (both inclusive; null for no limit). Items without such rentals are left out.
    /// </summary>
    Task<IReadOnlyList<ItemRentalStats>> GetItemRentalStatsAsync(
        DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default);
}
