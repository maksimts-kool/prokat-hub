namespace ProkatHub.Worker.Api;

// The worker's own copies of the few API fields it needs. It does not reference the API project, so these only
// have to match the JSON (camelCase), not the API's C# types.

public sealed record LoginRequest(string Email, string Password);

public sealed record LoginResponse(string AccessToken, DateTimeOffset ExpiresAt);

/// <summary>An item of <c>GET /api/rentals/overdue</c>.</summary>
/// <param name="Status"><c>Issued</c> (not marked yet) or <c>Overdue</c> (marked on an earlier run).</param>
public sealed record OverdueRental(int Id, string ItemName, DateOnly EndDate, string Status);

/// <summary>The rental returned by <c>POST /api/rentals/{id}/mark-late</c>.</summary>
public sealed record MarkLateResult(int Id, string Status, int LateDays, decimal LateFeeTotal);
