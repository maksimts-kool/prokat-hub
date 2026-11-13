using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using Riok.Mapperly.Abstractions;

namespace ProkatHub.Api.Mapping;

/// <summary>Category and item entities to DTOs. Mapperly generates the bodies at compile time.</summary>
/// <remarks><c>CategoryName</c> is flattened from <c>Item.Category.Name</c>, so the category must be loaded.</remarks>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class CatalogueMapper
{
    public static partial CategoryDto ToDto(this Category category);

    public static partial ItemSummaryDto ToSummaryDto(this Item item);

    public static partial ItemDetailsDto ToDetailsDto(this Item item);
}
