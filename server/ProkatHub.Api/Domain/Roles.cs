namespace ProkatHub.Api.Domain;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
    public const string Customer = "Customer";
    public const string Service = "Service";

    public static readonly IReadOnlyList<string> All = [Admin, Staff, Customer, Service];
}
