using System.Diagnostics;
using Microsoft.IdentityModel.JsonWebTokens;

namespace ProkatHub.Api.Infrastructure;

/// <summary>
/// Writes one log line per HTTP request: method, path, status code, duration, user and trace id.
/// The trace id matches the <c>traceId</c> field in ProblemDetails error responses.
/// </summary>
public sealed class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    // Noisy, low-value paths are logged at Debug so they stay out of the default output.
    private static readonly PathString[] QuietPaths = ["/health", "/swagger", "/openapi", "/favicon.ico"];

    public async Task InvokeAsync(HttpContext context)
    {
        var startedAt = Stopwatch.GetTimestamp();
        var failed = false;
        try
        {
            await next(context);
        }
        catch
        {
            // Exceptions normally never reach here (UseExceptionHandler runs inside this middleware),
            // but if one does the response becomes a 500.
            failed = true;
            throw;
        }
        finally
        {
            Log(context, Stopwatch.GetElapsedTime(startedAt), failed);
        }
    }

    private void Log(HttpContext context, TimeSpan elapsed, bool failed)
    {
        var request = context.Request;
        var statusCode = failed ? StatusCodes.Status500InternalServerError : context.Response.StatusCode;

        var level = statusCode >= 500 ? LogLevel.Error
            : QuietPaths.Any(p => request.Path.StartsWithSegments(p)) ? LogLevel.Debug
            : LogLevel.Information;

        if (!logger.IsEnabled(level))
        {
            return;
        }

        var userId = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "anonymous";
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        logger.Log(level,
            "HTTP {Method} {Path}{Query} responded {StatusCode} in {ElapsedMs:0.0} ms (user {UserId}, trace {TraceId})",
            request.Method, request.Path.Value, request.QueryString.Value, statusCode, elapsed.TotalMilliseconds,
            userId, traceId);
    }
}
