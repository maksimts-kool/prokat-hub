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

public sealed record ItemListQuery
{
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 12;
}
