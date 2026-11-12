namespace ProkatHub.Tests.Support;

/// <summary>A clock that always returns the same moment.</summary>
public sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}
