using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Repositories;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>A tracked category, or null.</summary>
    Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>Whether another category already uses the name (ignoring case) or the slug.</summary>
    Task<(bool NameTaken, bool SlugTaken)> FindDuplicatesAsync(
        string name, string slug, int? exceptId, CancellationToken cancellationToken = default);

    /// <summary>Whether any item, active or retired, belongs to the category.</summary>
    Task<bool> HasItemsAsync(int id, CancellationToken cancellationToken = default);

    void Add(Category category);

    void Remove(Category category);

    /// <exception cref="Infrastructure.ConflictException">A unique index or foreign key rejected the change.</exception>
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
