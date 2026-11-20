using Microsoft.AspNetCore.SignalR;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Realtime;

/// <summary>Broadcasts <see cref="AvailabilityChanged"/> to every client connected to <see cref="AvailabilityHub"/>.</summary>
public sealed class SignalRAvailabilityNotifier(
    IHubContext<AvailabilityHub, IAvailabilityClient> hub,
    ILogger<SignalRAvailabilityNotifier> logger) : IAvailabilityNotifier
{
    public async Task AvailabilityChangedAsync(int itemId, DateOnly from, DateOnly to)
    {
        try
        {
            await hub.Clients.All.AvailabilityChanged(new AvailabilityChanged(itemId, from, to));
            logger.LogDebug("Sent AvailabilityChanged for item {ItemId} from {From} to {To}", itemId, from, to);
        }
        catch (Exception ex)
        {
            // The rental change is already committed; clients will see it on their next reload.
            logger.LogWarning(ex, "Could not send AvailabilityChanged for item {ItemId} from {From} to {To}",
                itemId, from, to);
        }
    }
}
