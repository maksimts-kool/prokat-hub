namespace ProkatHub.Api.Domain;

/// <summary>One physical unit that can be rented, e.g. a specific camera body.</summary>
public class Item
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public required string Name { get; set; }
    public required string Brand { get; set; }
    public required string Description { get; set; }
    public string? ImageUrl { get; set; }
    public decimal DailyPrice { get; set; }
    public decimal Deposit { get; set; }
    public decimal LateFeePerDay { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public List<Rental> Rentals { get; set; } = [];
}
