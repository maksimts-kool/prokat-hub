using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using Riok.Mapperly.Abstractions;

namespace ProkatHub.Api.Mapping;

/// <summary>Category and item entities to DTOs. Mapperly generates the bodies at compile time.</summary>
/// <remarks><c>CategoryName</c> is flattened from <c>Item.Category.Name</c>, so the category must be loaded.</remarks>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class CatalogueMapper
{
    /// <summary>The category with the number of its active items, which the caller counts.</summary>
    public static partial CategoryDto ToDto(this Category category, int itemCount);

    /// <param name="isAvailable">Whether the item is free on the dates the catalogue was asked about; null without dates.</param>
    public static partial ItemSummaryDto ToSummaryDto(this Item item, bool? isAvailable);

    public static partial ItemDetailsDto ToDetailsDto(this Item item);
}
