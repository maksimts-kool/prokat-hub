using System.ComponentModel.DataAnnotations;

namespace ProkatHub.Worker.Overdue;

/// <summary>How often overdue rentals are processed ("Overdue" section).</summary>
public sealed class OverdueOptions
{
    public const string SectionName = "Overdue";

    /// <summary>Time between runs. One hour by default.</summary>
    [Range(typeof(TimeSpan), "00:00:10", "7.00:00:00")]
    public TimeSpan Interval { get; set; } = TimeSpan.FromHours(1);

    /// <summary>Also run once right after start instead of waiting a full interval for the first run.</summary>
    public bool RunOnStartup { get; set; } = true;
}
