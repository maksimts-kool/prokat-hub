using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Items_DailyPrice", "\"DailyPrice\" > 0");
            t.HasCheckConstraint("CK_Items_Deposit", "\"Deposit\" >= 0");
            t.HasCheckConstraint("CK_Items_LateFeePerDay", "\"LateFeePerDay\" >= 0");
        });

        builder.Property(i => i.Name).HasMaxLength(150);
        builder.Property(i => i.Brand).HasMaxLength(80);
        builder.Property(i => i.Description).HasMaxLength(2000);
        builder.Property(i => i.ImageUrl).HasMaxLength(500);

        builder.HasOne(i => i.Category)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.Name);
    }
}
