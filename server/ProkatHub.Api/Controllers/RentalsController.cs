using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProkatHub.Api.Auth;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Controllers;

[ApiController]
[Route("api/rentals")]
[Produces("application/json")]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
public sealed class RentalsController(IRentalService rentals) : ControllerBase
{
    /// <summary>The signed-in customer's rentals, newest first.</summary>
    [HttpGet("mine")]
    [Authorize(Policy = Policies.Customer)]
    [ProducesResponseType<IReadOnlyList<RentalDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RentalDto>>> GetMine(CancellationToken cancellationToken) =>
        Ok(await rentals.GetForCustomerAsync(User.GetUserId(), cancellationToken));
}
