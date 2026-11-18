using ProkatHub.Worker.Api;

namespace ProkatHub.Worker.Overdue;

/// <param name="Found">Rentals in the overdue list.</param>
/// <param name="NewlyOverdue">Rentals that were Issued and are now Overdue.</param>
/// <param name="FeesUpdated">Rentals that were already Overdue and had their late fee brought up to date.</param>
/// <param name="Failed">Rentals the API refused to mark (e.g. returned in the meantime).</param>
public sealed record OverdueRunResult(int Found, int NewlyOverdue, int FeesUpdated, int Failed);

/// <summary>One run: lists overdue rentals and calls mark-late for each.</summary>
public sealed class OverdueProcessor(IProkatHubApiClient api, ILogger<OverdueProcessor> logger)
{
    /// <summary>
    /// Processes every overdue rental. A rental the API refuses (404, 409, …) is logged and counted as failed, and the
    /// run goes on. Auth errors and an unreachable API (after the resilience retries) end the run by throwing.
    /// </summary>
    public async Task<OverdueRunResult> RunAsync(CancellationToken cancellationToken)
    {
        var overdue = await api.GetOverdueRentalsAsync(cancellationToken);
        int newlyOverdue = 0, feesUpdated = 0, failed = 0;

        foreach (var rental in overdue)
        {
            try
            {
                var result = await api.MarkLateAsync(rental.Id, cancellationToken);
                var wasIssued = rental.Status == "Issued";
                if (wasIssued)
                {
                    newlyOverdue++;
                }
                else
                {
                    feesUpdated++;
                }

                logger.LogInformation(
                    "Rental {RentalId} ({ItemName}, due {EndDate:yyyy-MM-dd}) {Change}: {LateDays} late days, late fee {LateFeeTotal}",
                    rental.Id, rental.ItemName, rental.EndDate, wasIssued ? "marked Overdue" : "fee updated",
                    result.LateDays, result.LateFeeTotal);
            }
            catch (ProkatHubApiException ex) when (!ex.IsAuthError)
            {
                failed++;
                logger.LogWarning("Rental {RentalId} was not marked late: {Reason}", rental.Id, ex.Message);
            }
        }

        return new OverdueRunResult(overdue.Count, newlyOverdue, feesUpdated, failed);
    }
}
