using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProkatHub.Api.Auth;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Controllers;

[ApiController]
[Route("api/rentals")]
[Produces("application/json")]
public sealed class RentalsController(IRentalService rentals) : ControllerBase
{
    /// <summary>All rentals for the staff desk, newest start date first (Staff, Admin).</summary>
    /// <remarks>
    /// Filter by status with <c>?status=Issued&amp;status=Overdue</c>, and by the days a rental covers with
    /// <c>from</c> and <c>to</c>: a rental is listed when any of its days falls in that range.
    /// </remarks>
    [HttpGet]
    [Authorize(Policy = Policies.StaffDesk)]
    [ProducesResponseType<PagedResult<StaffRentalDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<StaffRentalDto>>> GetPage(
        [FromQuery] RentalListQuery query, CancellationToken cancellationToken) =>
        Ok(await rentals.GetPageAsync(query, cancellationToken));

    /// <summary>Rentals that should have been returned: Issued or Overdue, past their end date (Service, Staff, Admin).</summary>
    /// <remarks>
    /// Oldest end date first. Issued rentals in the list are not marked yet; call <c>mark-late</c> for each one.
    /// Overdue rentals stay in the list until they are returned, so calling <c>mark-late</c> again charges the new late days.
    /// </remarks>
    [HttpGet("overdue")]
    [Authorize(Policy = Policies.OverdueProcessing)]
    [ProducesResponseType<IReadOnlyList<StaffRentalDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<StaffRentalDto>>> GetOverdue(CancellationToken cancellationToken) =>
        Ok(await rentals.GetOverdueAsync(cancellationToken));

    /// <summary>Marks a rental past its end date as Overdue and brings its late fee up to date (Service, Staff, Admin).</summary>
    /// <remarks>
    /// The late fee is one charge of the rental's <c>lateFeePerDay</c> (copied from the item, seeded as 150 % of the
    /// daily price) for each day from the day after the end date up to today. Each day is charged once, so calling
    /// this again recalculates the fee up to today instead of adding duplicates; it is safe to retry.
    /// Issued → Overdue is saved in the status history. Returns 409 when the rental is not Issued or Overdue,
    /// or its end date has not passed yet.
    /// </remarks>
    [HttpPost("{id:int}/mark-late")]
    [Authorize(Policy = Policies.OverdueProcessing)]
    [ProducesResponseType<RentalDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RentalDto>> MarkLate(int id, CancellationToken cancellationToken) =>
        Ok(await rentals.MarkLateAsync(id, User.GetUserId(), cancellationToken));

    /// <summary>Changes a rental's status (Customer, Staff, Admin).</summary>
    /// <remarks>
    /// Allowed changes: Booked → Issued (staff, from the start date to the end date), Booked → Cancelled
    /// (the customer who booked it, or staff), Issued → Returned and Overdue → Returned (staff).
    /// Returning an item after its end date charges each late day at the rental's late fee, up to the day of return.
    /// Any other change is a 409; a change allowed only for staff is a 403 for customers.
    /// Every change is saved in the status history with the time and the user.
    /// </remarks>
    [HttpPatch("{id:int}/status")]
    [Authorize(Policy = Policies.RentalStatusChange)]
    [ProducesResponseType<RentalDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RentalDto>> ChangeStatus(
        int id, ChangeRentalStatusRequest request, CancellationToken cancellationToken)
    {
        var actor = User.IsInRole(Roles.Staff) || User.IsInRole(Roles.Admin) ? RentalActor.Staff : RentalActor.Customer;
        // ChangeRentalStatusRequestValidator guarantees the status before the action runs.
        return Ok(await rentals.ChangeStatusAsync(
            id, request.Status!.Value, request.Note, User.GetUserId(), actor, cancellationToken));
    }

    /// <summary>Books an item for the signed-in customer (Customer).</summary>
    /// <remarks>
    /// The price, discount and deposit are calculated on the server, as in <c>GET /api/rentals/quote</c>.
    /// Returns 409 when a Booked, Issued or Overdue rental already takes any of the days.
    /// An item that is out past its end date stays taken until today.
    /// </remarks>
    [HttpPost]
    [Authorize(Policy = Policies.Customer)]
    [ProducesResponseType<RentalDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RentalDto>> Create(CreateRentalRequest request, CancellationToken cancellationToken)
    {
        // CreateRentalRequestValidator guarantees all three values before the action runs.
        var rental = await rentals.CreateAsync(
            User.GetUserId(), request.ItemId!.Value, request.From!.Value, request.To!.Value, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, rental);
    }

    /// <summary>The signed-in customer's rentals, newest first.</summary>
    [HttpGet("my")]
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
        // RentalQuoteQueryValidator guarantees all three values before the action runs.
        Ok(await rentals.GetQuoteAsync(query.ItemId!.Value, query.From!.Value, query.To!.Value, cancellationToken));
}
