using Microsoft.AspNetCore.Authorization;
using ProkatHub.Api.Domain;

namespace ProkatHub.Api.Auth;

public static class Policies
{
    /// <summary>Booking items and viewing own rentals.</summary>
    public const string Customer = nameof(Customer);

    /// <summary>Issuing and receiving items at the desk.</summary>
    public const string StaffDesk = nameof(StaffDesk);

    /// <summary>
    /// Changing a rental's status: customers cancel their own bookings, staff issue and receive items.
    /// Which change each role may make is checked by <see cref="Domain.RentalStatusRules"/>.
    /// </summary>
    public const string RentalStatusChange = nameof(RentalStatusChange);

    /// <summary>Catalogue edits and reports.</summary>
    public const string Admin = nameof(Admin);

    /// <summary>Listing overdue rentals and charging late fees (also used by the Worker Service).</summary>
    public const string OverdueProcessing = nameof(OverdueProcessing);

    public static AuthorizationBuilder AddProkatHubPolicies(this AuthorizationBuilder builder) => builder
        .AddPolicy(Customer, p => p.RequireRole(Roles.Customer))
        .AddPolicy(StaffDesk, p => p.RequireRole(Roles.Staff, Roles.Admin))
        .AddPolicy(RentalStatusChange, p => p.RequireRole(Roles.Customer, Roles.Staff, Roles.Admin))
        .AddPolicy(Admin, p => p.RequireRole(Roles.Admin))
        .AddPolicy(OverdueProcessing, p => p.RequireRole(Roles.Service, Roles.Staff, Roles.Admin));
}
