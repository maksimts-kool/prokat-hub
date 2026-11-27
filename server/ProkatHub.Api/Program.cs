using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using FluentValidation;
using MicroElements.AspNetCore.OpenApi.FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ProkatHub.Api.Auth;
using ProkatHub.Api.Data;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Infrastructure;
using ProkatHub.Api.Realtime;
using ProkatHub.Api.Repositories;
using ProkatHub.Api.Services;
using ProkatHub.Api.Validation;
using Serilog;

const string ClientCorsPolicy = "Client";

// Debug builds start the app under the OpenAPI document generator only to read its endpoints (see the .csproj).
// It has no database or secrets, so startup checks and seeding are skipped there.
var isGeneratingOpenApiDocument = Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider";

var builder = WebApplication.CreateBuilder(args);

// --- Logging ---
// Serilog replaces the default console logger; levels and output come from the "Serilog" section.
builder.Services.AddSerilog((services, logger) => logger
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// --- Database & Identity ---
// MariaDB through Pomelo. The server version is set in config instead of detected, so startup and `dotnet ef`
// don't need a live connection; it decides which SQL features the generated queries and migrations may use.
var mariaDbVersion = new MariaDbServerVersion(builder.Configuration.GetValue("Database:ServerVersion", "10.11")!);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("Default"), mariaDbVersion));

builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>();

// --- Authentication & authorization ---
var jwtOptions = builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .ValidateDataAnnotations();
if (!isGeneratingOpenApiDocument)
{
    jwtOptions.ValidateOnStart();
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((options, jwtOptions) =>
    {
        var jwt = jwtOptions.Value;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            NameClaimType = AuthConstants.NameClaimType,
            RoleClaimType = AuthConstants.RoleClaimType,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
        // Browsers can't send an Authorization header when opening a WebSocket, so the SignalR client puts the token
        // in the query string instead. It is read only for hub paths; request logging hides it (RequestLogging).
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Query[AuthConstants.AccessTokenQueryParameter];
                if (!string.IsNullOrEmpty(token) && context.HttpContext.Request.Path.StartsWithSegments(AuthConstants.HubPathPrefix))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorizationBuilder().AddProkatHubPolicies();

// --- Application services ---
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<IRentalRepository, RentalRepository>();
builder.Services.AddScoped<IDiscountTierRepository, DiscountTierRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddSingleton<IPricingService, PricingService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IRentalService, RentalService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<ITokenService, JwtTokenService>();

// --- Real-time updates ---
builder.Services.AddSignalR();
builder.Services.AddSingleton<IAvailabilityNotifier, SignalRAvailabilityNotifier>();

builder.Services.Configure<SeedOptions>(builder.Configuration.GetSection(SeedOptions.SectionName));
builder.Services.AddScoped<DatabaseInitializer>();

// --- Web API ---
// Request rules live in FluentValidation validators (Validation/), run by FluentValidationFilter.
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddControllers(options =>
{
    options.Filters.Add<FluentValidationFilter>();
    // Non-nullable strings are not implicitly [Required]; the validators decide what is required.
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
}).AddJsonOptions(options =>
    // Numbers are numbers in requests too (the web default also accepts "12"), so the OpenAPI document and the
    // generated client type them as plain numbers instead of number | string.
    options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.Strict
).ConfigureApiBehaviorOptions(options =>
{
    // Log which fields failed automatic model validation; the response itself stays the default 400.
    var createResponse = options.InvalidModelStateResponseFactory;
    options.InvalidModelStateResponseFactory = context =>
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("ProkatHub.Api.Validation");
        logger.LogInformation("{Method} {Path} failed with 400: invalid fields {Fields}",
            context.HttpContext.Request.Method, context.HttpContext.Request.Path,
            string.Join(", ", context.ModelState.Where(e => e.Value?.Errors.Count > 0).Select(e => e.Key)));
        return createResponse(context);
    };
});
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Instance ??= $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}");
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// The OpenAPI schemas are built from these options, so they match the controllers' JSON settings above.
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);
builder.Services.AddFluentValidationRulesToOpenApi();
builder.Services.AddOpenApi(options =>
{
    // Copies validator rules (required, lengths, ranges, patterns) into the OpenAPI schemas.
    options.AddFluentValidationRules();
    options.AddDocumentTransformer<BearerSecurityTransformer>();
    options.AddOperationTransformer<BearerSecurityTransformer>();
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy(ClientCorsPolicy, policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");

var app = builder.Build();

if (!isGeneratingOpenApiDocument)
{
    await using var scope = app.Services.CreateAsyncScope();
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    await initializer.InitializeAsync(app.Configuration.GetValue<bool>("Database:MigrateOnStartup"));
}

// Behind a reverse proxy under a sub-path (Zone serves the app at /prokathub), requests start with that prefix.
// It moves into PathBase so routes stay /api/... and the static files below still match. This isn't UsePathBase:
// in a WebApplication that runs routing right away, so the client fallback route would win over static files.
// Requests without the prefix (the worker calls the API directly) pass through unchanged.
if (app.Configuration["PathBase"] is { Length: > 0 } pathBase)
{
    app.Use((context, next) =>
    {
        if (context.Request.Path.StartsWithSegments(pathBase, out var matched, out var remaining))
        {
            context.Request.PathBase = context.Request.PathBase.Add(matched);
            context.Request.Path = remaining;
        }

        return next(context);
    });
}

// First in the pipeline so it sees the final status code, including errors turned into ProblemDetails.
app.UseSerilogRequestLogging(RequestLogging.Configure);
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Prokat Hub API v1");
        options.DocumentTitle = "Prokat Hub API";
        options.EnablePersistAuthorization();
    });
}

// A production build of the React client in wwwroot is served by the API itself (one origin, so no CORS).
// In development Vite serves it instead and wwwroot doesn't exist.
var servesClient = app.Environment.WebRootFileProvider.GetFileInfo("index.html").Exists;
if (servesClient)
{
    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        // Vite puts a content hash in every file name under assets/, so those never change.
        OnPrepareResponse = context =>
        {
            if (context.Context.Request.Path.StartsWithSegments("/assets"))
            {
                context.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            }
        },
    });
}

app.UseRouting();
app.UseCors(ClientCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();
app.MapHub<AvailabilityHub>(AvailabilityHub.Path);
if (servesClient)
{
    // Client-side routes such as /items/5 get index.html; unknown /api and /ws paths still return 404.
    app.MapFallbackToFile("{*path:regex(^(?!api/|ws/).*$)}", "index.html");
}

app.Run();
