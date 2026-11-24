using NSubstitute;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;

namespace ProkatHub.Tests.Services;

public class ReportServiceTests
{
    private static readonly DateOnly From = new(2026, 11, 1);
    private static readonly DateOnly To = new(2026, 11, 30);

    private readonly IReportRepository _repository = Substitute.For<IReportRepository>();
    private readonly ReportService _service;

    public ReportServiceTests() => _service = new ReportService(_repository);

    private static ItemRentalStats Stats(int id, string name, int count, decimal total, decimal lateFees = 0m, bool active = true) =>
        new(id, name, "Sony", "Cameras", active, count, count * 2, total, lateFees);

    private void Returns(params ItemRentalStats[] stats) =>
        _repository.GetItemRentalStatsAsync(From, To, Arg.Any<CancellationToken>()).Returns(stats);

    [Fact]
    public async Task Items_are_ranked_by_rentals_then_revenue_then_name()
    {
        Returns(
            Stats(1, "Camera B", count: 2, total: 100m),
            Stats(2, "Camera A", count: 2, total: 100m),
            Stats(3, "Drone", count: 5, total: 50m),
            Stats(4, "Laptop", count: 2, total: 300m));

        var report = await _service.GetPopularItemsAsync(new PopularItemsQuery { From = From, To = To });

        Assert.Equal([3, 4, 2, 1], report.Items.Select(i => i.ItemId));
    }

    [Fact]
    public async Task Revenue_adds_late_fees_and_totals_cover_items_beyond_the_top()
    {
        Returns(
            Stats(1, "Camera", count: 3, total: 120m, lateFees: 30m),
            Stats(2, "Drone", count: 1, total: 80m, active: false));

        var report = await _service.GetPopularItemsAsync(new PopularItemsQuery { From = From, To = To, Top = 1 });

        var camera = Assert.Single(report.Items);
        Assert.Equal(150m, camera.Revenue);
        Assert.Equal(30m, camera.LateFees);
        Assert.Equal(6, camera.RentalDays);
        Assert.False(camera.IsRetired);
        Assert.Equal(4, report.TotalRentals);
        Assert.Equal(230m, report.TotalRevenue);
        Assert.Equal(From, report.From);
        Assert.Equal(To, report.To);
    }

    [Fact]
    public async Task Retired_items_are_flagged()
    {
        Returns(Stats(2, "Drone", count: 1, total: 80m, active: false));

        var report = await _service.GetPopularItemsAsync(new PopularItemsQuery { From = From, To = To });

        Assert.True(Assert.Single(report.Items).IsRetired);
    }

    [Fact]
    public async Task No_rentals_gives_an_empty_report()
    {
        Returns();

        var report = await _service.GetPopularItemsAsync(new PopularItemsQuery { From = From, To = To });

        Assert.Empty(report.Items);
        Assert.Equal(0, report.TotalRentals);
        Assert.Equal(0m, report.TotalRevenue);
    }
}
