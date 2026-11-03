using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data.Configurations;

public class RentalConfiguration : IEntityTypeConfiguration<Rental>
{
    public void Configure(EntityTypeBuilder<Rental> builder)
    {
        builder.ToTable(t => t.HasCheckConstraint("CK_Rentals_Dates", "\"EndDate\" >= \"StartDate\""));

        builder.Property(r => r.DiscountPercent).HasPrecision(5, 2);

        builder.HasOne(r => r.Item)
            .WithMany(i => i.Rentals)
            .HasForeignKey(r => r.ItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Customer)
            .WithMany(u => u.Rentals)
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Used by the overlap check when booking.
        builder.HasIndex(r => new { r.ItemId, r.StartDate, r.EndDate });
        builder.HasIndex(r => r.Status);
    }
}
