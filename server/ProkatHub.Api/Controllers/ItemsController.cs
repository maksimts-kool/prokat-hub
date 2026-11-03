using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Controllers;

[ApiController]
[Route("api/items")]
[AllowAnonymous]
[Produces("application/json")]
public sealed class ItemsController(IItemService items) : ControllerBase
{
    /// <summary>One page of the rentable item catalogue.</summary>
    [HttpGet]
    [ProducesResponseType<PagedResult<ItemSummaryDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<ItemSummaryDto>>> GetPage(
        [FromQuery] ItemListQuery query, CancellationToken cancellationToken) =>
        Ok(await items.GetPageAsync(query, cancellationToken));

    /// <summary>Details of one item.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType<ItemDetailsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItemDetailsDto>> GetById(int id, CancellationToken cancellationToken) =>
        Ok(await items.GetByIdAsync(id, cancellationToken));
}
