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
public sealed class RentalsController(IRentalService rentals) : ControllerBase
{
    /// <summary>The signed-in customer's rentals, newest first.</summary>
    [HttpGet("mine")]
    [Authorize(Policy = Policies.Customer)]
    [ProducesResponseType<IReadOnlyList<RentalDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<RentalDto>>> GetMine(CancellationToken cancellationToken) =>
        Ok(await rentals.GetForCustomerAsync(User.GetUserId(), cancellationToken));

    /// <summary>Price of renting an item for a date range, before booking.</summary>
    /// <remarks>
    /// The discount comes from the longest discount tier the rental length reaches.
    /// The deposit is refundable and is not included in <c>totalPrice</c>. The quote does not check availability.
    /// </remarks>
    [HttpGet("quote")]
    [AllowAnonymous]
    [ProducesResponseType<RentalQuoteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RentalQuoteDto>> GetQuote(
        [FromQuery] RentalQuoteQuery query, CancellationToken cancellationToken) =>
        // [Required] on the query guarantees all three values once model validation has passed.
        Ok(await rentals.GetQuoteAsync(query.ItemId!.Value, query.From!.Value, query.To!.Value, cancellationToken));
}
