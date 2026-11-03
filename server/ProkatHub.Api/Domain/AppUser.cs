using Microsoft.AspNetCore.Identity;

namespace ProkatHub.Api.Domain;

public class AppUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    public List<Rental> Rentals { get; set; } = [];
}
