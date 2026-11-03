namespace ProkatHub.Api.Infrastructure;

/// <summary>Expected errors that the API turns into ProblemDetails with a matching status code.</summary>
public abstract class AppException(string message) : Exception(message)
{
    public abstract int StatusCode { get; }
    public abstract string Title { get; }
}

public sealed class NotFoundException(string message) : AppException(message)
{
    public override int StatusCode => StatusCodes.Status404NotFound;
    public override string Title => "Not found";
}

public sealed class ConflictException(string message) : AppException(message)
{
    public override int StatusCode => StatusCodes.Status409Conflict;
    public override string Title => "Conflict";
}

public sealed class BadRequestException(string message) : AppException(message)
{
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public override string Title => "Bad request";
}

public sealed class UnauthorizedException(string message) : AppException(message)
{
    public override int StatusCode => StatusCodes.Status401Unauthorized;
    public override string Title => "Unauthorized";
}

/// <summary>Field-level validation errors, returned as ValidationProblemDetails.</summary>
public sealed class RequestValidationException(IDictionary<string, string[]> errors)
    : AppException("One or more validation errors occurred.")
{
    public IDictionary<string, string[]> Errors { get; } = errors;
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public override string Title => "One or more validation errors occurred.";
}
