using ProkatHub.Api.Domain;

namespace ProkatHub.Tests.Domain;

public class RentalStatusRulesTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);

    public static TheoryData<RentalStatus, RentalStatus, RentalActor> AllowedChanges => new()
    {
        { RentalStatus.Booked, RentalStatus.Issued, RentalActor.Staff },
        { RentalStatus.Booked, RentalStatus.Cancelled, RentalActor.Customer | RentalActor.Staff },
        { RentalStatus.Issued, RentalStatus.Returned, RentalActor.Staff },
        { RentalStatus.Overdue, RentalStatus.Returned, RentalActor.Staff },
    };

    /// <summary>Every pair of statuses that is not in <see cref="AllowedChanges"/>.</summary>
    public static TheoryData<RentalStatus, RentalStatus> ForbiddenChanges
    {
        get
        {
            var allowed = AllowedChanges.Select(row => ((RentalStatus)row[0], (RentalStatus)row[1])).ToHashSet();
            var data = new TheoryData<RentalStatus, RentalStatus>();
            foreach (var from in Enum.GetValues<RentalStatus>())
            {
                foreach (var to in Enum.GetValues<RentalStatus>())
                {
                    if (!allowed.Contains((from, to)))
                    {
                        data.Add(from, to);
                    }
                }
            }

            return data;
        }
    }

    [Theory]
    [MemberData(nameof(AllowedChanges))]
    public void Allowed_change_lists_who_may_make_it(RentalStatus from, RentalStatus to, RentalActor actors)
    {
        Assert.Equal(actors, RentalStatusRules.AllowedActors(from, to));
        Assert.Equal(actors.HasFlag(RentalActor.Customer), RentalStatusRules.CanChange(from, to, RentalActor.Customer));
        Assert.True(RentalStatusRules.CanChange(from, to, RentalActor.Staff));
    }

    [Theory]
    [MemberData(nameof(ForbiddenChanges))]
    public void Any_other_change_is_allowed_for_nobody(RentalStatus from, RentalStatus to)
    {
        Assert.Equal(RentalActor.None, RentalStatusRules.AllowedActors(from, to));
        Assert.False(RentalStatusRules.CanChange(from, to, RentalActor.Customer));
        Assert.False(RentalStatusRules.CanChange(from, to, RentalActor.Staff));
    }

    [Fact]
    public void Nobody_is_not_an_actor()
    {
        Assert.False(RentalStatusRules.CanChange(RentalStatus.Booked, RentalStatus.Cancelled, RentalActor.None));
    }

    private static Rental Rental(RentalStatus status, int startOffset, int endOffset) => new()
    {
        Status = status,
        StartDate = Today.AddDays(startOffset),
        EndDate = Today.AddDays(endOffset),
    };

    // The rental below takes days 10–14. Ranges are inclusive at both ends.
    [Theory]
    [InlineData(5, 9, false)] // ends the day before it starts
    [InlineData(15, 20, false)] // starts the day after it ends
    [InlineData(5, 10, true)] // touches its first day
    [InlineData(14, 20, true)] // touches its last day
    [InlineData(11, 13, true)] // inside it
    [InlineData(5, 20, true)] // around it
    [InlineData(12, 12, true)] // one day in the middle
    public void Booked_rental_takes_exactly_its_own_days(int from, int to, bool takes)
    {
        var rental = Rental(RentalStatus.Booked, 10, 14);

        Assert.Equal(takes, rental.TakesAnyDay(Today.AddDays(from), Today.AddDays(to), Today));
    }

    [Theory]
    [InlineData(RentalStatus.Cancelled)]
    [InlineData(RentalStatus.Returned)]
    public void Cancelled_and_returned_rentals_take_no_days(RentalStatus status)
    {
        var rental = Rental(status, 10, 14);

        Assert.False(rental.TakesAnyDay(Today.AddDays(5), Today.AddDays(20), Today));
        Assert.False(rental.TakesAnyDay(Today.AddDays(12), Today.AddDays(12), Today));
    }

    [Theory]
    [InlineData(RentalStatus.Issued)]
    [InlineData(RentalStatus.Overdue)]
    public void Item_still_out_after_its_end_date_takes_today_but_not_tomorrow(RentalStatus status)
    {
        var rental = Rental(status, -7, -3);

        Assert.True(rental.TakesAnyDay(Today, Today, Today));
        Assert.False(rental.TakesAnyDay(Today.AddDays(1), Today.AddDays(3), Today));
    }

    [Fact]
    public void Late_days_are_charged_from_the_day_after_the_end_date_up_to_today()
    {
        var now = new DateTimeOffset(Today.ToDateTime(new TimeOnly(10, 0)), TimeSpan.Zero);
        var rental = Rental(RentalStatus.Overdue, -6, -3);
        rental.Id = 7;
        rental.LateFeePerDay = 15m;

        var added = rental.ChargeLateDays(Today, now);

        Assert.Equal([Today.AddDays(-2), Today.AddDays(-1), Today], added.Select(f => f.ChargeDate));
        Assert.All(added, f =>
        {
            Assert.Equal(7, f.RentalId);
            Assert.Equal(15m, f.Amount);
            Assert.Equal(now, f.CreatedAt);
        });
        Assert.Equal(45m, rental.LateFees.Sum(f => f.Amount));
    }

    [Fact]
    public void Charging_again_adds_only_the_days_not_charged_yet()
    {
        var rental = Rental(RentalStatus.Overdue, -6, -3);
        rental.LateFeePerDay = 15m;
        rental.LateFees.Add(new LateFee { ChargeDate = Today.AddDays(-2), Amount = 12m });

        rental.ChargeLateDays(Today.AddDays(-1), DateTimeOffset.UnixEpoch);
        var added = rental.ChargeLateDays(Today, DateTimeOffset.UnixEpoch);

        Assert.Equal([Today], added.Select(f => f.ChargeDate));
        Assert.Equal(3, rental.LateFees.Count);
        Assert.Equal(12m + 15m + 15m, rental.LateFees.Sum(f => f.Amount));
    }

    [Fact]
    public void Rental_returned_on_time_has_no_late_days()
    {
        var rental = Rental(RentalStatus.Issued, -2, 0);
        rental.LateFeePerDay = 15m;

        Assert.Empty(rental.ChargeLateDays(Today, DateTimeOffset.UnixEpoch));
        Assert.Empty(rental.LateFees);
    }
}
