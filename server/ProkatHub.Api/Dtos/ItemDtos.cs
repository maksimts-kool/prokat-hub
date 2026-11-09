using System.ComponentModel.DataAnnotations;

namespace ProkatHub.Api.Dtos;

public sealed record ItemSummaryDto(
    int Id,
    string Name,
    string Brand,
    int CategoryId,
    string CategoryName,
    decimal DailyPrice,
    decimal Deposit,
    string? ImageUrl);

public sealed record ItemDetailsDto(
    int Id,
    string Name,
    string Brand,
    string Description,
    int CategoryId,
    string CategoryName,
    decimal DailyPrice,
    decimal Deposit,
    decimal LateFeePerDay,
    string? ImageUrl);

/// <summary>Catalogue sort orders accepted by <c>GET /api/items?sort=</c>.</summary>
public static class ItemSort
{
    public const string Name = "name";
    public const string NameDesc = "name_desc";
    public const string Price = "price";
    public const string PriceDesc = "price_desc";

    /// <summary>Most rented items first.</summary>
    public const string Popularity = "popularity";

    public static readonly IReadOnlyList<string> All = [Name, NameDesc, Price, PriceDesc, Popularity];
}

/// <summary>Query string of <c>GET /api/items</c>.</summary>
public sealed record ItemListQuery : IValidatableObject
{
    /// <summary>Case-insensitive text matched against name, brand and description.</summary>
    [StringLength(100)]
    public string? Search { get; init; }

    [Range(1, int.MaxValue)]
    public int? CategoryId { get; init; }

    [Range(typeof(decimal), "0", "1000000")]
    public decimal? MinPrice { get; init; }

    [Range(typeof(decimal), "0", "1000000")]
    public decimal? MaxPrice { get; init; }

    /// <summary>One of <c>name</c> (default), <c>name_desc</c>, <c>price</c>, <c>price_desc</c>, <c>popularity</c>.</summary>
    public string? Sort { get; init; }

    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 12;

    /// <summary>The sort order in lower case, or <see cref="ItemSort.Name"/> when none was given.</summary>
    public string NormalizedSort => string.IsNullOrWhiteSpace(Sort) ? ItemSort.Name : Sort.Trim().ToLowerInvariant();

    /// <summary>The search text without surrounding spaces, or null when it is blank.</summary>
    public string? NormalizedSearch => string.IsNullOrWhiteSpace(Search) ? null : Search.Trim();

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!ItemSort.All.Contains(NormalizedSort))
        {
            yield return new ValidationResult(
                $"Sort must be one of: {string.Join(", ", ItemSort.All)}.", [nameof(Sort)]);
        }

        if (MinPrice is { } min && MaxPrice is { } max && min > max)
        {
            yield return new ValidationResult(
                "MinPrice must not be greater than MaxPrice.", [nameof(MinPrice), nameof(MaxPrice)]);
        }
    }
}
