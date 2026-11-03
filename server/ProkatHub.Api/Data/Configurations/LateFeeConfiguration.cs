using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data.Configurations;

public class LateFeeConfiguration : IEntityTypeConfiguration<LateFee>
{
    public void Configure(EntityTypeBuilder<LateFee> builder)
    {
        builder.HasOne(f => f.Rental)
            .WithMany(r => r.LateFees)
            .HasForeignKey(f => f.RentalId)
            .OnDelete(DeleteBehavior.Cascade);

        // Each late day is charged once, so the hourly job can safely re-run.
        builder.HasIndex(f => new { f.RentalId, f.ChargeDate }).IsUnique();
    }
}
