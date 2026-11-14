using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProkatHub.Api.Auth;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Controllers;

[ApiController]
[Route("api/items")]
[Produces("application/json")]
public sealed class ItemsController(IItemService items) : ControllerBase
{
    /// <summary>One page of the rentable item catalogue.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<PagedResult<ItemSummaryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<ItemSummaryDto>>> GetPage(
        [FromQuery] ItemListQuery query, CancellationToken cancellationToken) =>
        Ok(await items.GetPageAsync(query, cancellationToken));

    /// <summary>Details of one item.</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType<ItemDetailsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemDetailsDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await items.GetByIdAsync(id, cancellationToken));

    /// <summary>Booked days of an item between two dates, and whether the whole range is free.</summary>
    /// <remarks>Only Booked, Issued and Overdue rentals take days. An item that is out past its end date stays taken until today.</remarks>
    [HttpGet("{id:int}/availability")]
    [AllowAnonymous]
    [ProducesResponseType<ItemAvailabilityDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemAvailabilityDto>> GetAvailability(
        int id, [FromQuery] DateRangeQuery query, CancellationToken cancellationToken) =>
        // DateRangeQueryValidator guarantees both dates before the action runs.
        Ok(await items.GetAvailabilityAsync(id, query.From!.Value, query.To!.Value, cancellationToken));

    /// <summary>Adds an item to the catalogue (Admin).</summary>
    [HttpPost]
    [Authorize(Policy = Policies.Admin)]
    [ProducesResponseType<ItemDetailsDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ItemDetailsDto>> Create(ItemRequest request, CancellationToken cancellationToken)
    {
        var item = await items.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    /// <summary>Replaces an item's details (Admin). Existing rentals keep the prices they were booked with.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.Admin)]
    [ProducesResponseType<ItemDetailsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemDetailsDto>> Update(int id, ItemRequest request, CancellationToken cancellationToken) =>
        Ok(await items.UpdateAsync(id, request, cancellationToken));

    /// <summary>Retires an item (Admin): it leaves the catalogue but stays in the rental history.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = Policies.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await items.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
