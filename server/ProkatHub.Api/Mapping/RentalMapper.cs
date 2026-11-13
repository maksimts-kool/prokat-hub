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
    /// is the sum of <c>Rental.LateFees</c>, so both must be loaded.
    /// </remarks>
    [MapProperty(nameof(Rental.LateFees), nameof(RentalDto.LateFeeTotal), Use = nameof(SumLateFees))]
    public static partial RentalDto ToDto(this Rental rental);

    /// <summary>A price breakdown plus the item and dates it was calculated for.</summary>
    public static partial RentalQuoteDto ToDto(this RentalQuote quote, int itemId, string itemName, DateOnly from, DateOnly to);

    private static decimal SumLateFees(List<LateFee> lateFees) => lateFees.Sum(f => f.Amount);
}
