using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProkatHub.Api.Auth;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Produces("application/json")]
[Authorize(Policy = Policies.Admin)]
public sealed class ReportsController(IReportService reports) : ControllerBase
{
    /// <summary>The items rented most, with their rental count and revenue (Admin).</summary>
    /// <remarks>
    /// Counts rentals that are not cancelled and start between <c>from</c> and <c>to</c>; without dates, every
    /// rental. Revenue is the rentals' totals plus the late fees charged on them. Retired items are included.
    /// </remarks>
    [HttpGet("popular-items")]
    [ProducesResponseType<PopularItemsReportDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PopularItemsReportDto>> GetPopularItems(
        [FromQuery] PopularItemsQuery query, CancellationToken cancellationToken) =>
        Ok(await reports.GetPopularItemsAsync(query, cancellationToken));
}
