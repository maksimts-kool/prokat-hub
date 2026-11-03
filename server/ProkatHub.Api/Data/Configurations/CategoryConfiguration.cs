using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.Property(c => c.Name).HasMaxLength(100);
        builder.Property(c => c.Slug).HasMaxLength(100);
        builder.Property(c => c.Description).HasMaxLength(500);

        builder.HasIndex(c => c.Name).IsUnique();
        builder.HasIndex(c => c.Slug).IsUnique();
    }
}
