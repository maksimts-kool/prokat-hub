using FluentValidation;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Validation;

public sealed class ItemListQueryValidator : AbstractValidator<ItemListQuery>
{
    public const decimal PriceLimit = 1_000_000m;

    public ItemListQueryValidator()
    {
        RuleFor(x => x.Search).MaximumLength(100);
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.MinPrice).InclusiveBetween(0m, PriceLimit);
        RuleFor(x => x.MaxPrice).InclusiveBetween(0m, PriceLimit);

        RuleFor(x => x.Sort)
            .Must((query, _) => ItemSort.All.Contains(query.NormalizedSort))
            .WithMessage($"Sort must be one of: {string.Join(", ", ItemSort.All)}.");

        RuleFor(x => x.MinPrice)
            .LessThanOrEqualTo(x => x.MaxPrice)
            .When(x => x.MaxPrice.HasValue)
            .WithMessage("MinPrice must not be greater than MaxPrice.");

        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class ItemRequestValidator : AbstractValidator<ItemRequest>
{
    public ItemRequestValidator()
    {
        RuleFor(x => x.CategoryId).NotNull().GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().Length(2, 150);
        RuleFor(x => x.Brand).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);

        // A blank image URL is allowed and stored as "no image".
        RuleFor(x => x.ImageUrl)
            .MaximumLength(500)
            .Must(BeHttpUrl)
            .WithMessage("ImageUrl must be an absolute http or https URL.")
            .When(x => !string.IsNullOrWhiteSpace(x.ImageUrl));

        RuleFor(x => x.DailyPrice).NotNull().InclusiveBetween(0.01m, 100_000m);
        RuleFor(x => x.Deposit).NotNull().InclusiveBetween(0m, 1_000_000m);
        RuleFor(x => x.LateFeePerDay).NotNull().InclusiveBetween(0m, 100_000m);
    }

    private static bool BeHttpUrl(string? url) =>
        Uri.TryCreate(url?.Trim(), UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
