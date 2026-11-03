using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data.Configurations;

public class DiscountTierConfiguration : IEntityTypeConfiguration<DiscountTier>
{
    public void Configure(EntityTypeBuilder<DiscountTier> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_DiscountTiers_MinDays", "\"MinDays\" >= 1");
            t.HasCheckConstraint("CK_DiscountTiers_Percent", "\"Percent\" >= 0 AND \"Percent\" <= 100");
        });

        builder.Property(d => d.Name).HasMaxLength(50);
        builder.Property(d => d.Percent).HasPrecision(5, 2);

        builder.HasIndex(d => d.MinDays).IsUnique();
    }
}
