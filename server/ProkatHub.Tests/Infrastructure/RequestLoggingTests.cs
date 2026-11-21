using ProkatHub.Api.Infrastructure;

namespace ProkatHub.Tests.Infrastructure;

public class RequestLoggingTests
{
    [Theory]
    [InlineData("/ws/availability?id=abc&access_token=eyJ.secret.sig", "/ws/availability?id=abc&access_token=***")]
    [InlineData("/ws/availability?access_token=eyJ.secret.sig&id=abc", "/ws/availability?access_token=***&id=abc")]
    [InlineData("/ws/availability/negotiate?negotiateVersion=1&ACCESS_TOKEN=x", "/ws/availability/negotiate?negotiateVersion=1&ACCESS_TOKEN=***")]
    public void Access_token_is_hidden_in_the_logged_path(string path, string expected) =>
        Assert.Equal(expected, RequestLogging.RedactAccessToken(path));

    [Theory]
    [InlineData("/api/items?page=2&pageSize=10")]
    [InlineData("/api/items?my_access_token=keep")]
    [InlineData("/health")]
    public void Other_paths_are_logged_as_they_are(string path) =>
        Assert.Equal(path, RequestLogging.RedactAccessToken(path));
}
