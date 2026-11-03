namespace ProkatHub.Api.Domain;

public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? Description { get; set; }

    public List<Item> Items { get; set; } = [];
}
