using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using Riok.Mapperly.Abstractions;

namespace ProkatHub.Api.Mapping;

/// <summary>Users to DTOs. Mapperly generates the bodies at compile time.</summary>
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public static partial class UserMapper
{
    /// <summary>The user with the role names that were looked up for it.</summary>
    [MapProperty(nameof(AppUser.Email), nameof(UserDto.Email), Use = nameof(EmailOrEmpty))]
    public static partial UserDto ToDto(this AppUser user, IReadOnlyList<string> roles);

    // Identity allows a null email; every account here is created with one.
    private static string EmailOrEmpty(string? email) => email ?? string.Empty;
}
