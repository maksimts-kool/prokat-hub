using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data.Configurations;

public class RentalStatusHistoryConfiguration : IEntityTypeConfiguration<RentalStatusHistory>
{
    public void Configure(EntityTypeBuilder<RentalStatusHistory> builder)
    {
        builder.ToTable("RentalStatusHistory");

        builder.Property(h => h.Note).HasMaxLength(500);

        builder.HasOne(h => h.Rental)
            .WithMany(r => r.StatusHistory)
            .HasForeignKey(h => h.RentalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.ChangedBy)
            .WithMany()
            .HasForeignKey(h => h.ChangedById)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
