using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Services;
using Riok.Mapperly.Abstractions;

namespace ProkatHub.Api.Mapping;

/// <summary>Rentals and quotes to DTOs. Mapperly generates the bodies at compile time.</summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class RentalMapper
{
    /// <remarks>
    /// <c>ItemName</c> and <c>ItemImageUrl</c> are flattened from <c>Rental.Item</c>, and <c>LateFeeTotal</c>
    /// and <c>LateDays</c> are the sum and count of <c>Rental.LateFees</c>, so both must be loaded.
    /// </remarks>
    [MapProperty(nameof(Rental.LateFees), nameof(RentalDto.LateFeeTotal), Use = nameof(SumLateFees))]
    [MapProperty(nameof(Rental.LateFees), nameof(RentalDto.LateDays), Use = nameof(CountLateDays))]
    public static partial RentalDto ToDto(this Rental rental);

    /// <remarks>
    /// Like <see cref="ToDto(Rental)"/>, and <c>CustomerFullName</c> and <c>CustomerEmail</c> are flattened
    /// from <c>Rental.Customer</c>, so it must be loaded too.
    /// </remarks>
    [MapProperty(nameof(Rental.LateFees), nameof(StaffRentalDto.LateFeeTotal), Use = nameof(SumLateFees))]
    [MapProperty(nameof(Rental.LateFees), nameof(StaffRentalDto.LateDays), Use = nameof(CountLateDays))]
    public static partial StaffRentalDto ToStaffDto(this Rental rental);

    /// <summary>A price breakdown plus the item and dates it was calculated for.</summary>
    public static partial RentalQuoteDto ToDto(this RentalQuote quote, int itemId, string itemName, DateOnly from, DateOnly to);

    private static decimal SumLateFees(List<LateFee> lateFees) => lateFees.Sum(f => f.Amount);

    private static int CountLateDays(List<LateFee> lateFees) => lateFees.Count;
}
