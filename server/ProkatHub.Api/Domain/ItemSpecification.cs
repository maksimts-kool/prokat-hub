namespace ProkatHub.Api.Domain;

/// <summary>
/// One line of an item's technical specifications, e.g. <c>cpu</c> = "Apple M4 Pro, 12-core".
/// The key is a fixed camelCase name the client translates; the value is shown as written.
/// </summary>
public class ItemSpecification
{
    public required string Key { get; set; }
    public required string Value { get; set; }
}
