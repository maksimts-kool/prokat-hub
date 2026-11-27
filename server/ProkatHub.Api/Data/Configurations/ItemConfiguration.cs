using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Data.Configurations;

public class ItemConfiguration : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Items_DailyPrice", "`DailyPrice` > 0");
            t.HasCheckConstraint("CK_Items_Deposit", "`Deposit` >= 0");
            t.HasCheckConstraint("CK_Items_LateFeePerDay", "`LateFeePerDay` >= 0");
        });

        builder.Property(i => i.Name).HasMaxLength(150);
        builder.Property(i => i.Brand).HasMaxLength(80);
        builder.Property(i => i.Description).HasMaxLength(2000);

        // The list is stored as JSON text in one column. Pomelo doesn't support ToJson() owned collections, so a
        // value converter serializes it; the comparer lets change tracking notice edits inside the list.
        builder.Property(i => i.Specifications)
            .HasConversion(
                specs => JsonSerializer.Serialize(specs, SpecificationJson),
                json => JsonSerializer.Deserialize<List<ItemSpecification>>(json, SpecificationJson) ?? new List<ItemSpecification>(),
                new ValueComparer<List<ItemSpecification>>(
                    (a, b) => JsonSerializer.Serialize(a, SpecificationJson) == JsonSerializer.Serialize(b, SpecificationJson),
                    specs => JsonSerializer.Serialize(specs, SpecificationJson).GetHashCode(),
                    specs => JsonSerializer.Deserialize<List<ItemSpecification>>(
                        JsonSerializer.Serialize(specs, SpecificationJson), SpecificationJson)!))
            .HasColumnType("json");

        builder.Property(i => i.ImageUrls)
            .HasConversion(
                urls => JsonSerializer.Serialize(urls, SpecificationJson),
                json => JsonSerializer.Deserialize<List<string>>(json, SpecificationJson) ?? new List<string>(),
                new ValueComparer<List<string>>(
                    (a, b) => a!.SequenceEqual(b!),
                    urls => urls.Aggregate(0, (hash, url) => HashCode.Combine(hash, url.GetHashCode())),
                    urls => urls.ToList()))
            .HasColumnType("json");

        builder.HasOne(i => i.Category)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(i => i.Name);
    }

    private static readonly JsonSerializerOptions SpecificationJson = new(JsonSerializerDefaults.Web);
}
