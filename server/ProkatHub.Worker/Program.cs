using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Options;
using ProkatHub.Worker.Api;
using ProkatHub.Worker.Overdue;
using Serilog;

var builder = Host.CreateApplicationBuilder(args);

// --- Logging ---
// Same Serilog setup and console output as the API; levels and format come from the "Serilog" section.
builder.Services.AddSerilog((services, logger) => logger
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// --- Options ---
builder.Services.AddOptions<ProkatHubApiOptions>()
    .Bind(builder.Configuration.GetSection(ProkatHubApiOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();
builder.Services.AddOptions<OverdueOptions>()
    .Bind(builder.Configuration.GetSection(OverdueOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// --- API client ---
// The worker talks to the API over HTTP only; it has no database access and no reference to the API project.
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<AccessTokenCache>();
builder.Services
    .AddHttpClient<IProkatHubApiClient, ProkatHubApiClient>((services, client) =>
    {
        var baseUrl = services.GetRequiredService<IOptions<ProkatHubApiOptions>>().Value.BaseUrl;
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        // The resilience pipeline's total timeout limits each call instead.
        client.Timeout = Timeout.InfiniteTimeSpan;
    })
    // Polly: total timeout, retries with exponential backoff and jitter, circuit breaker and a timeout per attempt.
    // The "Resilience" section gives retries enough time to wait out an API restart.
    .AddStandardResilienceHandler(builder.Configuration.GetSection("Resilience"))
    .Configure(ResilienceLogging.Configure);

// --- Overdue processing ---
builder.Services.AddTransient<OverdueProcessor>();
builder.Services.AddHostedService<OverdueWorker>();

var host = builder.Build();
host.Run();
