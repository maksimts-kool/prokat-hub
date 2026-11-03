using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Services;

namespace ProkatHub.Api.Data;

/// <summary>Applies migrations and seeds roles, role accounts, discount tiers and demo data.</summary>
public sealed class DatabaseInitializer(
    AppDbContext db,
    RoleManager<IdentityRole<Guid>> roleManager,
    UserManager<AppUser> userManager,
    IPricingService pricingService,
    IOptions<SeedOptions> seedOptions,
    TimeProvider timeProvider,
    ILogger<DatabaseInitializer> logger)
{
    public async Task InitializeAsync(bool applyMigrations, CancellationToken cancellationToken = default)
    {
        if (applyMigrations)
        {
            logger.LogInformation("Applying database migrations");
            await db.Database.MigrateAsync(cancellationToken);
        }

        await EnsureRolesAsync();
        await EnsureAccountsAsync();
        await EnsureDiscountTiersAsync(cancellationToken);

        if (seedOptions.Value.DemoData)
        {
            await SeedDemoCatalogueAsync(cancellationToken);
            await SeedDemoRentalsAsync(cancellationToken);
        }
    }

    private async Task EnsureRolesAsync()
    {
        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                ThrowIfFailed(await roleManager.CreateAsync(new IdentityRole<Guid>(role)), $"create role {role}");
                logger.LogInformation("Created role {Role}", role);
            }
        }
    }

    private async Task EnsureAccountsAsync()
    {
        foreach (var (role, account) in seedOptions.Value.Accounts)
        {
            if (!Roles.All.Contains(role))
            {
                logger.LogWarning("Skipping seed account for unknown role {Role}", role);
                continue;
            }

            if (string.IsNullOrWhiteSpace(account.Password))
            {
                logger.LogWarning("No password configured for the {Role} account (Seed:Accounts:{Role}:Password); skipping it", role, role);
                continue;
            }

            if (await userManager.FindByEmailAsync(account.Email) is not null)
            {
                continue;
            }

            var user = new AppUser
            {
                UserName = account.Email,
                Email = account.Email,
                EmailConfirmed = true,
                FullName = account.FullName,
                CreatedAt = timeProvider.GetUtcNow(),
            };
            ThrowIfFailed(await userManager.CreateAsync(user, account.Password), $"create {role} account");
            ThrowIfFailed(await userManager.AddToRoleAsync(user, role), $"add {role} role");
            logger.LogInformation("Created {Role} account {Email}", role, account.Email);
        }
    }

    private async Task EnsureDiscountTiersAsync(CancellationToken cancellationToken)
    {
        if (await db.DiscountTiers.AnyAsync(cancellationToken))
        {
            return;
        }

        db.DiscountTiers.AddRange(DemoCatalogue.DiscountTiers.Select(t => new DiscountTier
        {
            Name = t.Name,
            MinDays = t.MinDays,
            Percent = t.Percent,
        }));
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded discount tiers");
    }

    private async Task SeedDemoCatalogueAsync(CancellationToken cancellationToken)
    {
        if (await db.Categories.AnyAsync(cancellationToken))
        {
            return;
        }

        var categories = DemoCatalogue.Categories(timeProvider.GetUtcNow());
        db.Categories.AddRange(categories);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Categories} categories and {Items} items",
            categories.Count, categories.Sum(c => c.Items.Count));
    }

    private async Task SeedDemoRentalsAsync(CancellationToken cancellationToken)
    {
        if (await db.Rentals.AnyAsync(cancellationToken))
        {
            return;
        }

        var customer = await FindSeedUserAsync(Roles.Customer);
        if (customer is null)
        {
            logger.LogWarning("Demo rentals need the Customer seed account; skipping them");
            return;
        }

        var staffId = (await FindSeedUserAsync(Roles.Staff))?.Id;
        var serviceId = (await FindSeedUserAsync(Roles.Service))?.Id;

        var now = timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var tiers = await db.DiscountTiers.AsNoTracking().ToListAsync(cancellationToken);
        var items = await db.Items.ToDictionaryAsync(i => i.Name, cancellationToken);

        Rental Book(string itemName, int startOffset, int endOffset)
        {
            var item = items[itemName];
            var start = today.AddDays(startOffset);
            var end = today.AddDays(endOffset);
            var quote = pricingService.Calculate(item.DailyPrice, item.Deposit, start, end, tiers);
            var bookedAt = now.AddDays(Math.Min(startOffset, 0) - 3);

            var rental = new Rental
            {
                Item = item,
                CustomerId = customer.Id,
                StartDate = start,
                EndDate = end,
                Status = RentalStatus.Booked,
                DailyPrice = item.DailyPrice,
                DiscountPercent = quote.DiscountPercent,
                TotalPrice = quote.TotalPrice,
                Deposit = item.Deposit,
                LateFeePerDay = item.LateFeePerDay,
                CreatedAt = bookedAt,
            };
            rental.StatusHistory.Add(new RentalStatusHistory
            {
                ToStatus = RentalStatus.Booked,
                ChangedAt = bookedAt,
                ChangedById = customer.Id,
            });
            return rental;
        }

        void Move(Rental rental, RentalStatus to, DateTimeOffset at, Guid? byUserId, string? note = null)
        {
            rental.StatusHistory.Add(new RentalStatusHistory
            {
                FromStatus = rental.Status,
                ToStatus = to,
                ChangedAt = at,
                ChangedById = byUserId,
                Note = note,
            });
            rental.Status = to;
            if (to == RentalStatus.Issued) rental.IssuedAt = at;
            if (to == RentalStatus.Returned) rental.ReturnedAt = at;
        }

        DateTimeOffset At(DateOnly date, int hour) => new(date.ToDateTime(new TimeOnly(hour, 0)), TimeSpan.Zero);

        var upcoming = Book("Sony Alpha 7 IV", 3, 6);

        var issued = Book("DJI Mini 4 Pro", -2, 2);
        Move(issued, RentalStatus.Issued, At(issued.StartDate, 10), staffId);

        var returned = Book("Apple MacBook Pro 14\" M4 Pro", -20, -13);
        Move(returned, RentalStatus.Issued, At(returned.StartDate, 9), staffId);
        Move(returned, RentalStatus.Returned, At(returned.EndDate, 17), staffId);

        var longReturned = Book("Rode Wireless PRO", -40, -25);
        Move(longReturned, RentalStatus.Issued, At(longReturned.StartDate, 11), staffId);
        Move(longReturned, RentalStatus.Returned, At(longReturned.EndDate, 16), staffId);

        var overdue = Book("Sony PlayStation 5 Pro", -8, -3);
        Move(overdue, RentalStatus.Issued, At(overdue.StartDate, 12), staffId);
        Move(overdue, RentalStatus.Overdue, At(overdue.EndDate.AddDays(1), 0), serviceId, "Not returned by the end date");
        for (var day = overdue.EndDate.AddDays(1); day <= today; day = day.AddDays(1))
        {
            overdue.LateFees.Add(new LateFee { ChargeDate = day, Amount = overdue.LateFeePerDay, CreatedAt = At(day, 0) });
        }

        var cancelled = Book("Epson EH-TW7100", 10, 12);
        Move(cancelled, RentalStatus.Cancelled, now.AddHours(-5), customer.Id, "Plans changed");

        db.Rentals.AddRange(upcoming, issued, returned, longReturned, overdue, cancelled);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded demo rentals");
    }

    private async Task<AppUser?> FindSeedUserAsync(string role) =>
        seedOptions.Value.Accounts.TryGetValue(role, out var account)
            ? await userManager.FindByEmailAsync(account.Email)
            : null;

    private static void ThrowIfFailed(IdentityResult result, string action)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Could not {action}: {string.Join(" ", result.Errors.Select(e => e.Description))}");
        }
    }
}
