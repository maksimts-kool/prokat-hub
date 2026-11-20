namespace ProkatHub.Api.Services;

/// <summary>
/// Tells connected clients that an item's availability changed, so they can reload it without refreshing the page.
/// The SignalR implementation is <see cref="Realtime.SignalRAvailabilityNotifier"/>; tests use a mock.
/// </summary>
public interface IAvailabilityNotifier
{
    /// <summary>
    /// Announces that item <paramref name="itemId"/> became taken or free on some days from <paramref name="from"/>
    /// to <paramref name="to"/> (both inclusive). Call it only after the change is committed. It does not throw:
    /// the change is already saved, so a failed broadcast is logged instead.
    /// </summary>
    Task AvailabilityChangedAsync(int itemId, DateOnly from, DateOnly to);
}
