using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.IdentityModel.JsonWebTokens;
using ProkatHub.Api.Auth;
using Serilog.AspNetCore;
using Serilog.Events;

namespace ProkatHub.Api.Infrastructure;

/// <summary>
/// Settings for Serilog's request logging: one line per HTTP request with method, path, status code,
/// duration, user and trace id. The trace id matches the <c>traceId</c> field in ProblemDetails error responses.
/// </summary>
public static partial class RequestLogging
{
    // Noisy, low-value paths are logged at Debug so they stay out of the default output.
    private static readonly PathString[] QuietPaths = ["/health", "/swagger", "/openapi", "/favicon.ico"];

    public static void Configure(RequestLoggingOptions options)
    {
        options.IncludeQueryInRequestPath = true;
        // Same properties as Serilog's default, but SignalR's access_token is never written to the log.
        options.GetMessageTemplateProperties = (context, requestPath, elapsed, statusCode) =>
        [
            new LogEventProperty("RequestMethod", new ScalarValue(context.Request.Method)),
            new LogEventProperty("RequestPath", new ScalarValue(RedactAccessToken(requestPath))),
            new LogEventProperty("StatusCode", new ScalarValue(statusCode)),
            new LogEventProperty("Elapsed", new ScalarValue(elapsed)),
        ];
        options.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0} ms (user {UserId}, trace {TraceId})";

        options.GetLevel = (context, _, exception) =>
            exception is not null || context.Response.StatusCode >= StatusCodes.Status500InternalServerError
                ? LogEventLevel.Error
                : QuietPaths.Any(p => context.Request.Path.StartsWithSegments(p))
                    ? LogEventLevel.Debug
                    : LogEventLevel.Information;

        options.EnrichDiagnosticContext = (diagnostics, context) =>
        {
            diagnostics.Set("UserId", context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "anonymous");
            diagnostics.Set("TraceId", Activity.Current?.Id ?? context.TraceIdentifier);
        };
    }

    /// <summary>Replaces the value of the <c>access_token</c> query parameter with <c>***</c>.</summary>
    public static string RedactAccessToken(string requestPath) =>
        AccessTokenPattern().Replace(requestPath, "$1***");

    [GeneratedRegex($@"([?&]{AuthConstants.AccessTokenQueryParameter}=)[^&#]*", RegexOptions.IgnoreCase)]
    private static partial Regex AccessTokenPattern();
}
