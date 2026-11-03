using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Dtos;

public sealed record RentalDto(
    int Id,
    int ItemId,
    string ItemName,
    string? ItemImageUrl,
    DateOnly StartDate,
    DateOnly EndDate,
    int Days,
    RentalStatus Status,
    decimal DailyPrice,
    decimal DiscountPercent,
    decimal TotalPrice,
    decimal Deposit,
    decimal LateFeeTotal,
    DateTimeOffset CreatedAt);
