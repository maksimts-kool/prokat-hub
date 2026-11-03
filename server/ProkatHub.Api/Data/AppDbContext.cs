using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Rental> Rentals => Set<Rental>();
    public DbSet<RentalStatusHistory> RentalStatusHistory => Set<RentalStatusHistory>();
    public DbSet<DiscountTier> DiscountTiers => Set<DiscountTier>();
    public DbSet<LateFee> LateFees => Set<LateFee>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Money columns; DiscountTier.Percent overrides this.
        configurationBuilder.Properties<decimal>().HavePrecision(10, 2);
        configurationBuilder.Properties<RentalStatus>().HaveConversion<string>().HaveMaxLength(20);
    }
}
