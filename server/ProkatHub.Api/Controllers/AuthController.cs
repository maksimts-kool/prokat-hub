using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    /// <summary>Creates a Customer account and signs it in.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var response = await auth.RegisterAsync(request, cancellationToken);
        return CreatedAtAction(nameof(Me), response);
    }

    /// <summary>Returns a JWT for valid credentials.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken) =>
        Ok(await auth.LoginAsync(request, cancellationToken));

    /// <summary>The signed-in user.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken) =>
        Ok(await auth.GetUserAsync(User.GetUserId(), cancellationToken));
}
