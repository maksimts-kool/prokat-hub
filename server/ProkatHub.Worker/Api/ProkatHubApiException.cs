using System.Net;

namespace ProkatHub.Worker.Api;

/// <summary>The API answered with an error status (after the resilience pipeline's retries, where they apply).</summary>
public sealed class ProkatHubApiException(HttpStatusCode statusCode, string message) : Exception(message)
{
    public HttpStatusCode StatusCode { get; } = statusCode;

    /// <summary>401 or 403: the Service account cannot log in or is not allowed to process overdue rentals.</summary>
    public bool IsAuthError => StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden;
}
