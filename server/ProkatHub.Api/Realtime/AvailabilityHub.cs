using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ProkatHub.Api.Realtime;

/// <summary>
/// Message sent to clients as <c>AvailabilityChanged</c>: item <paramref name="ItemId"/> became taken or free on some
/// days from <paramref name="From"/> to <paramref name="To"/> (both inclusive). Clients showing that item for dates
/// that overlap the range should reload its availability.
/// </summary>
public sealed record AvailabilityChanged(int ItemId, DateOnly From, DateOnly To);

/// <summary>Methods the server calls on connected clients. The method name is the message name.</summary>
public interface IAvailabilityClient
{
    Task AvailabilityChanged(AvailabilityChanged change);
}

/// <summary>
/// Live availability updates at <see cref="Path"/>. Any signed-in user may connect; browsers pass the JWT as the
/// <c>access_token</c> query parameter because WebSockets can't send an Authorization header.
/// Clients only listen: messages are sent by <see cref="SignalRAvailabilityNotifier"/> after a rental change is saved.
/// </summary>
[Authorize]
public sealed class AvailabilityHub : Hub<IAvailabilityClient>
{
    public const string Path = "/ws/availability";
}
