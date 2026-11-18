using Microsoft.Extensions.Http.Resilience;

namespace ProkatHub.Worker.Api;

/// <summary>
/// One short warning per retry and per circuit break, instead of Polly's own events, which repeat the full stack trace
/// of a refused connection on every attempt (e.g. while the API starts). Polly's category is set to Error in appsettings.
/// </summary>
public static class ResilienceLogging
{
    public static void Configure(HttpStandardResilienceOptions options, IServiceProvider services)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("ProkatHub.Worker.Resilience");
        var maxAttempts = options.Retry.MaxRetryAttempts;

        options.Retry.OnRetry = args =>
        {
            logger.LogWarning("API call failed ({Reason}); retry {Attempt} of {MaxAttempts} in {Delay:0.0} s",
                Describe(args.Outcome.Result, args.Outcome.Exception), args.AttemptNumber + 1, maxAttempts,
                args.RetryDelay.TotalSeconds);
            return default;
        };

        options.CircuitBreaker.OnOpened = args =>
        {
            logger.LogWarning("Too many failed API calls ({Reason}); calls are paused for {BreakDuration:0.0} s",
                Describe(args.Outcome.Result, args.Outcome.Exception), args.BreakDuration.TotalSeconds);
            return default;
        };

        options.CircuitBreaker.OnClosed = _ =>
        {
            logger.LogInformation("API calls resumed");
            return default;
        };
    }

    private static string Describe(HttpResponseMessage? response, Exception? exception) =>
        exception?.Message
        ?? (response is null ? "no response" : $"{(int)response.StatusCode} {response.ReasonPhrase}");
}
