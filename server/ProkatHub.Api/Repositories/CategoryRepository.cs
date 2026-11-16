using Microsoft.EntityFrameworkCore;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;

namespace ProkatHub.Api.Repositories;

public sealed class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync(cancellationToken);

    public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<(bool NameTaken, bool SlugTaken)> FindDuplicatesAsync(
        string name, string slug, int? exceptId, CancellationToken cancellationToken = default)
    {
        var lowerName = name.ToLower();
        var duplicates = await db.Categories.AsNoTracking()
            .Where(c => c.Id != exceptId && (c.Name.ToLower() == lowerName || c.Slug == slug))
            .Select(c => new { c.Name, c.Slug })
            .ToListAsync(cancellationToken);

        return (
            duplicates.Any(c => string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase)),
            duplicates.Any(c => c.Slug == slug));
    }

    public Task<bool> HasItemsAsync(int id, CancellationToken cancellationToken = default) =>
        db.Items.AnyAsync(i => i.CategoryId == id, cancellationToken);

    public void Add(Category category) => db.Categories.Add(category);

    public void Remove(Category category) => db.Categories.Remove(category);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException e) when (e.IsUniqueViolation())
        {
            throw new ConflictException("A category with this name or slug already exists.");
        }
        catch (DbUpdateException e) when (e.IsForeignKeyViolation())
        {
            throw new ConflictException("The category still has items.");
        }
    }
}
