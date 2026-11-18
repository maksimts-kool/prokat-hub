using System.Diagnostics;
using Microsoft.Extensions.Options;
using Polly;
using ProkatHub.Worker.Api;

namespace ProkatHub.Worker.Overdue;

/// <summary>
/// Runs <see cref="OverdueProcessor"/> on a <see cref="PeriodicTimer"/> (hourly by default). Each run gets its own
/// scope, so it gets a fresh typed HttpClient. A failed run is logged and the worker waits for the next tick.
/// </summary>
public sealed class OverdueWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<OverdueOptions> options,
    TimeProvider timeProvider,
    ILogger<OverdueWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var settings = options.Value;
        logger.LogInformation("Overdue worker started; runs every {Interval}", settings.Interval);

        using var timer = new PeriodicTimer(settings.Interval, timeProvider);
        try
        {
            if (settings.RunOnStartup)
            {
                await RunOnceAsync(stoppingToken);
            }

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RunOnceAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // The host is shutting down.
        }
    }

    private async Task RunOnceAsync(CancellationToken stoppingToken)
    {
        var started = Stopwatch.GetTimestamp();
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var processor = scope.ServiceProvider.GetRequiredService<OverdueProcessor>();
            var result = await processor.RunAsync(stoppingToken);

            logger.Log(result.Failed > 0 ? LogLevel.Warning : LogLevel.Information,
                "Overdue run finished in {Elapsed:0} ms: {Found} overdue, {NewlyOverdue} newly marked Overdue, {FeesUpdated} fees updated, {Failed} failed",
                Stopwatch.GetElapsedTime(started).TotalMilliseconds,
                result.Found, result.NewlyOverdue, result.FeesUpdated, result.Failed);
        }
        catch (Exception ex) when (!stoppingToken.IsCancellationRequested && IsExpectedFailure(ex))
        {
            // The API is down or refused the Service account; the message says enough without a stack trace.
            logger.LogError("Overdue run failed after {Elapsed:0} ms (next run in {Interval}): {Reason}",
                Stopwatch.GetElapsedTime(started).TotalMilliseconds, options.Value.Interval, ex.Message);
        }
        catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
        {
            logger.LogError(ex, "Overdue run failed after {Elapsed:0} ms; next run in {Interval}",
                Stopwatch.GetElapsedTime(started).TotalMilliseconds, options.Value.Interval);
        }
    }

    /// <summary>API errors, an unreachable API, and Polly timeouts or an open circuit after the retries.</summary>
    private static bool IsExpectedFailure(Exception ex) =>
        ex is ProkatHubApiException or HttpRequestException or ExecutionRejectedException;
}
