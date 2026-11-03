using System.Text.Json.Serialization;

namespace ProkatHub.Api.Domain;

[JsonConverter(typeof(JsonStringEnumConverter<RentalStatus>))]
public enum RentalStatus
{
    Booked,
    Issued,
    Returned,
    Overdue,
    Cancelled,
}
