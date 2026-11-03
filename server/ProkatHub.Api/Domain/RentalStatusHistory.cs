namespace ProkatHub.Api.Domain;

public class RentalStatusHistory
{
    public int Id { get; set; }
    public int RentalId { get; set; }
    public Rental Rental { get; set; } = null!;

    /// <summary>Null for the entry written when the rental is created.</summary>
    public RentalStatus? FromStatus { get; set; }

    public RentalStatus ToStatus { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
    public Guid? ChangedById { get; set; }
    public AppUser? ChangedBy { get; set; }
    public string? Note { get; set; }
}
