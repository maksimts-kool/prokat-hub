namespace ProkatHub.Api.Domain;

/// <summary>Fee for one late day of a rental. At most one row per rental and day.</summary>
public class LateFee
{
    public int Id { get; set; }
    public int RentalId { get; set; }
    public Rental Rental { get; set; } = null!;
    public DateOnly ChargeDate { get; set; }
    public decimal Amount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
