using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace ProkatHub.Api.Infrastructure;

public static class DbUpdateExceptionExtensions
{
    /// <summary>A unique index rejected the change, e.g. two requests created the same name at once.</summary>
    public static bool IsUniqueViolation(this DbUpdateException exception) =>
        exception.InnerException is MySqlException { ErrorCode: MySqlErrorCode.DuplicateKeyEntry };

    /// <summary>A foreign key rejected the change, e.g. deleting a row that other rows still point to.</summary>
    public static bool IsForeignKeyViolation(this DbUpdateException exception) =>
        exception.InnerException is MySqlException
        {
            ErrorCode: MySqlErrorCode.RowIsReferenced2 or MySqlErrorCode.NoReferencedRow2
                or MySqlErrorCode.RowIsReferenced or MySqlErrorCode.NoReferencedRow,
        };
}
