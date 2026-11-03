namespace ProkatHub.Api.Domain;

public class Rental
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public Item Item { get; set; } = null!;
    public Guid CustomerId { get; set; }
    public AppUser Customer { get; set; } = null!;

    /// <summary>First rental day (inclusive).</summary>
    public DateOnly StartDate { get; set; }

    /// <summary>Last rental day (inclusive).</summary>
    public DateOnly EndDate { get; set; }

    public RentalStatus Status { get; set; } = RentalStatus.Booked;

    // Copied from the item when booking, so later catalogue changes don't affect existing rentals.
    public decimal DailyPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal Deposit { get; set; }
    public decimal LateFeePerDay { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? IssuedAt { get; set; }
    public DateTimeOffset? ReturnedAt { get; set; }

    public List<RentalStatusHistory> StatusHistory { get; set; } = [];
    public List<LateFee> LateFees { get; set; } = [];

    public int Days => EndDate.DayNumber - StartDate.DayNumber + 1;
}
