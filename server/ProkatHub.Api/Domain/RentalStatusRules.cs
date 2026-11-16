namespace ProkatHub.Api.Domain;

/// <summary>Who may make a status change.</summary>
[Flags]
public enum RentalActor
{
    None = 0,

    /// <summary>The customer who booked the rental.</summary>
    Customer = 1,

    /// <summary>Staff or administrators at the desk.</summary>
    Staff = 2,
}

public static class RentalStatusRules
{
    /// <summary>
    /// Status changes made through <c>PATCH /api/rentals/{id}/status</c> and who may make them.
    /// Issued → Overdue is not here: only the overdue process (<c>mark-late</c>) sets it.
    /// </summary>
    private static readonly Dictionary<(RentalStatus From, RentalStatus To), RentalActor> Transitions = new()
    {
        [(RentalStatus.Booked, RentalStatus.Issued)] = RentalActor.Staff,
        [(RentalStatus.Booked, RentalStatus.Cancelled)] = RentalActor.Customer | RentalActor.Staff,
        [(RentalStatus.Issued, RentalStatus.Returned)] = RentalActor.Staff,
        [(RentalStatus.Overdue, RentalStatus.Returned)] = RentalActor.Staff,
    };

    /// <summary>Who may change a rental from <paramref name="from"/> to <paramref name="to"/>; <see cref="RentalActor.None"/> when nobody may.</summary>
    public static RentalActor AllowedActors(RentalStatus from, RentalStatus to) =>
        Transitions.GetValueOrDefault((from, to), RentalActor.None);

    /// <summary>Whether <paramref name="actor"/> may change a rental from <paramref name="from"/> to <paramref name="to"/>.</summary>
    public static bool CanChange(RentalStatus from, RentalStatus to, RentalActor actor) =>
        actor != RentalActor.None && (AllowedActors(from, to) & actor) != 0;

    /// <summary>Statuses that keep an item from being booked by someone else.</summary>
    public static bool BlocksItem(this RentalStatus status) =>
        status is RentalStatus.Booked or RentalStatus.Issued or RentalStatus.Overdue;

    /// <summary>
    /// Last day the rental keeps the item taken. An item that has been issued but not returned
    /// stays taken at least until today, even after its end date.
    /// </summary>
    public static DateOnly BlockedUntil(this Rental rental, DateOnly today) =>
        rental.Status is RentalStatus.Issued or RentalStatus.Overdue && rental.EndDate < today
            ? today
            : rental.EndDate;

    /// <summary>
    /// Whether the rental keeps the item taken on any day from <paramref name="from"/> to <paramref name="to"/>
    /// (both inclusive). Cancelled and returned rentals never do.
    /// </summary>
    public static bool TakesAnyDay(this Rental rental, DateOnly from, DateOnly to, DateOnly today) =>
        rental.Status.BlocksItem() && rental.StartDate <= to && rental.BlockedUntil(today) >= from;

    /// <summary>
    /// Adds a late fee for every day from the day after the end date up to <paramref name="today"/> that has none yet,
    /// at the rental's <see cref="Rental.LateFeePerDay"/>. Days already charged are kept as they are, so this can run
    /// any number of times without charging a day twice.
    /// </summary>
    /// <returns>The fees that were added.</returns>
    public static IReadOnlyList<LateFee> ChargeLateDays(this Rental rental, DateOnly today, DateTimeOffset now)
    {
        var charged = rental.LateFees.Select(f => f.ChargeDate).ToHashSet();
        var added = new List<LateFee>();
        for (var day = rental.EndDate.AddDays(1); day <= today; day = day.AddDays(1))
        {
            if (charged.Contains(day))
            {
                continue;
            }

            var fee = new LateFee { RentalId = rental.Id, ChargeDate = day, Amount = rental.LateFeePerDay, CreatedAt = now };
            rental.LateFees.Add(fee);
            added.Add(fee);
        }

        return added;
    }
}
