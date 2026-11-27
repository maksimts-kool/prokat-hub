using ProkatHub.Api.Dtos;
using ProkatHub.Api.Repositories;

namespace ProkatHub.Api.Services;

public sealed class ReportService(IReportRepository reports) : IReportService
{
    public async Task<PopularItemsReportDto> GetPopularItemsAsync(
        PopularItemsQuery query, CancellationToken cancellationToken = default)
    {
        var stats = await reports.GetItemRentalStatsAsync(query.From, query.To, cancellationToken);

        // The catalogue is small, so the totals and the ranking are worked out here from one row per item.
        var items = stats
            .Select(s => new PopularItemDto(
                s.ItemId, s.Name, s.Brand, s.CategoryName, IsRetired: !s.IsActive,
                s.RentalCount, s.RentalDays, s.RentalTotal + s.LateFees, s.LateFees))
            .OrderByDescending(i => i.RentalCount)
            .ThenByDescending(i => i.Revenue)
            .ThenBy(i => i.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(i => i.ItemId)
            .ToList();

        return new PopularItemsReportDto(
            query.From,
            query.To,
            items.Sum(i => i.RentalCount),
            items.Sum(i => i.Revenue),
            items.Take(query.Top).ToList());
    }
}
