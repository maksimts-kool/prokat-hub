namespace ProkatHub.Api.Dtos;

/// <summary>One item in the catalogue list.</summary>
/// <param name="IsAvailable">
/// Whether the item is free on every day of the <c>from</c>–<c>to</c> range of the request;
/// null when the request has no dates.
/// </param>
public sealed record ItemSummaryDto(
    int Id,
    string Name,
    string Brand,
    int CategoryId,
    string CategoryName,
    decimal DailyPrice,
    decimal Deposit,
    string? ImageUrl,
    bool? IsAvailable);

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
    string? ImageUrl,
    IReadOnlyList<ItemSpecificationDto> Specifications);

/// <summary>
/// One line of an item's specifications: a camelCase <c>Key</c> the client translates
/// (<c>cpu</c>, <c>ram</c>, <c>sensor</c>, …) and the <c>Value</c> shown as written.
/// </summary>
public sealed record ItemSpecificationDto(string Key, string Value);

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
/// <remarks>Rules: <see cref="Validation.ItemListQueryValidator"/>.</remarks>
public sealed record ItemListQuery
{
    /// <summary>Case-insensitive text matched against name, brand and description.</summary>
    public string? Search { get; init; }

    public int? CategoryId { get; init; }

    public decimal? MinPrice { get; init; }

    public decimal? MaxPrice { get; init; }

    /// <summary>
    /// First rental day (inclusive). With <see cref="To"/>, each item says whether it is free on those days;
    /// items that are taken are still listed.
    /// </summary>
    public DateOnly? From { get; init; }

    /// <summary>Last rental day (inclusive). Give both dates or neither.</summary>
    public DateOnly? To { get; init; }

    /// <summary>One of <c>name</c> (default), <c>name_desc</c>, <c>price</c>, <c>price_desc</c>, <c>popularity</c>.</summary>
    public string? Sort { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 12;

    // Methods rather than properties, so they don't show up as query parameters in the OpenAPI document.

    /// <summary>The sort order in lower case, or <see cref="ItemSort.Name"/> when none was given.</summary>
    public string NormalizedSort() => string.IsNullOrWhiteSpace(Sort) ? ItemSort.Name : Sort.Trim().ToLowerInvariant();

    /// <summary>The rental days asked about, or null when the request has no dates.</summary>
    public (DateOnly From, DateOnly To)? DateRange() => From is { } from && To is { } to ? (from, to) : null;

    /// <summary>The search text without surrounding spaces, or null when it is blank.</summary>
    public string? NormalizedSearch() => string.IsNullOrWhiteSpace(Search) ? null : Search.Trim();
}

/// <summary>Body of <c>POST /api/items</c> and <c>PUT /api/items/{id}</c>.</summary>
/// <remarks>Rules: <see cref="Validation.ItemRequestValidator"/>.</remarks>
public sealed record ItemRequest(
    int? CategoryId,
    string Name,
    string Brand,
    string Description,
    string? ImageUrl,
    decimal? DailyPrice,
    decimal? Deposit,
    decimal? LateFeePerDay,
    IReadOnlyList<ItemSpecificationDto>? Specifications = null);
