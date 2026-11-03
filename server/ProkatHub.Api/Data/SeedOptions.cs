namespace ProkatHub.Api.Data;

public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    /// <summary>Adds the demo catalogue and demo rentals when the tables are empty.</summary>
    public bool DemoData { get; set; }

    /// <summary>One account per role, keyed by role name. An account is created only when its password is set.</summary>
    public Dictionary<string, SeedAccount> Accounts { get; set; } = [];
}

public sealed class SeedAccount
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Password { get; set; }
}
