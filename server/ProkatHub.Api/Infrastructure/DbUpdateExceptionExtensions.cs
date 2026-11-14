using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ProkatHub.Api.Infrastructure;

public static class DbUpdateExceptionExtensions
{
    /// <summary>A unique index rejected the change, e.g. two requests created the same name at once.</summary>
    public static bool IsUniqueViolation(this DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    /// <summary>A foreign key rejected the change, e.g. deleting a row that other rows still point to.</summary>
    public static bool IsForeignKeyViolation(this DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation };
}
