using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ProkatHub.Api.Infrastructure;

/// <summary>Turns every exception into a ProblemDetails response.</summary>
public sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        ProblemDetails problem;
        if (exception is AppException appException)
        {
            if (appException is RequestValidationException invalid)
            {
                logger.LogInformation("{Method} {Path} failed with {StatusCode}: invalid fields {Fields}",
                    httpContext.Request.Method, httpContext.Request.Path, appException.StatusCode,
                    string.Join(", ", invalid.Errors.Keys));
            }
            else
            {
                logger.LogInformation("{Method} {Path} failed with {StatusCode}: {Message}",
                    httpContext.Request.Method, httpContext.Request.Path, appException.StatusCode, appException.Message);
            }

            problem = appException is RequestValidationException validation
                ? new ValidationProblemDetails(validation.Errors)
                : new ProblemDetails { Detail = appException.Message };
            problem.Status = appException.StatusCode;
            problem.Title = appException.Title;
        }
        else
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}",
                httpContext.Request.Method, httpContext.Request.Path);

            problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
            };
        }

        httpContext.Response.StatusCode = problem.Status.Value;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception,
        });
    }
}
