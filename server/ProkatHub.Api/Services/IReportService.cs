using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Services;

public interface IReportService
{
    /// <summary>
    /// The items rented most in the range: rentals that are not cancelled and start in it, with the days they
    /// cover and their revenue (rental totals plus late fees).
    /// </summary>
    Task<PopularItemsReportDto> GetPopularItemsAsync(PopularItemsQuery query, CancellationToken cancellationToken = default);
}
