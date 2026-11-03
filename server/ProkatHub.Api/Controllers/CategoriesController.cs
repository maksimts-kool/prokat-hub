using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Controllers;

[ApiController]
[Route("api/categories")]
[AllowAnonymous]
[Produces("application/json")]
public sealed class CategoriesController(ICategoryService categories) : ControllerBase
{
    /// <summary>All catalogue categories, sorted by name.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<CategoryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await categories.GetAllAsync(cancellationToken));
}
