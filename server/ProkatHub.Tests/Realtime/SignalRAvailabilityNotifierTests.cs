using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ProkatHub.Api.Realtime;

namespace ProkatHub.Tests.Realtime;

public class SignalRAvailabilityNotifierTests
{
    private static readonly DateOnly From = new(2026, 12, 1);
    private static readonly DateOnly To = new(2026, 12, 3);

    private readonly IHubContext<AvailabilityHub, IAvailabilityClient> _hub =
        Substitute.For<IHubContext<AvailabilityHub, IAvailabilityClient>>();
    private readonly IAvailabilityClient _everyone = Substitute.For<IAvailabilityClient>();
    private readonly SignalRAvailabilityNotifier _notifier;

    public SignalRAvailabilityNotifierTests()
    {
        _hub.Clients.All.Returns(_everyone);
        _notifier = new SignalRAvailabilityNotifier(_hub, NullLogger<SignalRAvailabilityNotifier>.Instance);
    }

    [Fact]
    public async Task Change_is_broadcast_to_every_connected_client()
    {
        await _notifier.AvailabilityChangedAsync(7, From, To);

        await _everyone.Received(1).AvailabilityChanged(new AvailabilityChanged(7, From, To));
    }

    [Fact]
    public async Task Failed_broadcast_does_not_fail_the_saved_change()
    {
        _everyone.AvailabilityChanged(Arg.Any<AvailabilityChanged>()).ThrowsAsync(new IOException("Connection reset"));

        var exception = await Record.ExceptionAsync(() => _notifier.AvailabilityChangedAsync(7, From, To));

        Assert.Null(exception);
    }
}
