using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ProkatHub.Worker.Api;
using ProkatHub.Worker.Overdue;

namespace ProkatHub.Tests.Worker;

public class OverdueProcessorTests
{
    private readonly IProkatHubApiClient _api = Substitute.For<IProkatHubApiClient>();
    private readonly OverdueProcessor _processor;

    public OverdueProcessorTests() => _processor = new OverdueProcessor(_api, NullLogger<OverdueProcessor>.Instance);

    private void GivenOverdue(params OverdueRental[] rentals) =>
        _api.GetOverdueRentalsAsync(Arg.Any<CancellationToken>()).Returns(rentals);

    private static OverdueRental Rental(int id, string status) => new(id, $"Item {id}", new DateOnly(2026, 11, 15), status);

    private void GivenMarked(int id) =>
        _api.MarkLateAsync(id, Arg.Any<CancellationToken>()).Returns(new MarkLateResult(id, "Overdue", 3, 180m));

    [Fact]
    public async Task Marks_every_overdue_rental_late_and_counts_new_and_updated_ones()
    {
        GivenOverdue(Rental(1, "Issued"), Rental(2, "Overdue"), Rental(3, "Issued"));
        GivenMarked(1);
        GivenMarked(2);
        GivenMarked(3);

        var result = await _processor.RunAsync(CancellationToken.None);

        Assert.Equal(new OverdueRunResult(Found: 3, NewlyOverdue: 2, FeesUpdated: 1, Failed: 0), result);
        await _api.Received(1).MarkLateAsync(1, Arg.Any<CancellationToken>());
        await _api.Received(1).MarkLateAsync(2, Arg.Any<CancellationToken>());
        await _api.Received(1).MarkLateAsync(3, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task No_overdue_rentals_is_an_empty_run()
    {
        GivenOverdue();

        var result = await _processor.RunAsync(CancellationToken.None);

        Assert.Equal(new OverdueRunResult(0, 0, 0, 0), result);
        await _api.DidNotReceive().MarkLateAsync(Arg.Any<int>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task A_rental_the_api_refuses_is_counted_as_failed_and_the_run_goes_on()
    {
        GivenOverdue(Rental(1, "Issued"), Rental(2, "Issued"));
        _api.MarkLateAsync(1, Arg.Any<CancellationToken>())
            .Throws(new ProkatHubApiException(HttpStatusCode.Conflict, "Rental 1 is Returned."));
        GivenMarked(2);

        var result = await _processor.RunAsync(CancellationToken.None);

        Assert.Equal(new OverdueRunResult(Found: 2, NewlyOverdue: 1, FeesUpdated: 0, Failed: 1), result);
    }

    [Fact]
    public async Task An_auth_error_ends_the_run()
    {
        GivenOverdue(Rental(1, "Issued"), Rental(2, "Issued"));
        _api.MarkLateAsync(1, Arg.Any<CancellationToken>())
            .Throws(new ProkatHubApiException(HttpStatusCode.Forbidden, "Forbidden"));

        await Assert.ThrowsAsync<ProkatHubApiException>(() => _processor.RunAsync(CancellationToken.None));
        await _api.DidNotReceive().MarkLateAsync(2, Arg.Any<CancellationToken>());
    }
}
