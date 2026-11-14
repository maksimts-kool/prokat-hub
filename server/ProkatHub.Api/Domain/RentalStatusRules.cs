namespace ProkatHub.Api.Domain;

public static class RentalStatusRules
{
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
}
