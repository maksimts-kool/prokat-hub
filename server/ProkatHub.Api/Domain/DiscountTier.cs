namespace ProkatHub.Api.Domain;

/// <summary>Discount applied when a rental lasts at least <see cref="MinDays"/> days.</summary>
public class DiscountTier
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int MinDays { get; set; }
    public decimal Percent { get; set; }
}
