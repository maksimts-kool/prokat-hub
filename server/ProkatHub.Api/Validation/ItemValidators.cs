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
            .Must((query, _) => ItemSort.All.Contains(query.NormalizedSort()))
            .WithMessage($"Sort must be one of: {string.Join(", ", ItemSort.All)}.");

        RuleFor(x => x.MinPrice)
            .LessThanOrEqualTo(x => x.MaxPrice)
            .When(x => x.MaxPrice.HasValue)
            .WithMessage("MinPrice must not be greater than MaxPrice.");

        RuleFor(x => x.To)
            .NotNull()
            .When(x => x.From.HasValue)
            .WithMessage("To is required when From is given.");
        RuleFor(x => x.From)
            .NotNull()
            .When(x => x.To.HasValue)
            .WithMessage("From is required when To is given.");
        When(x => x.From.HasValue && x.To.HasValue, () =>
        {
            RuleFor(x => x.From)
                .LessThanOrEqualTo(x => x.To)
                .WithMessage("From must not be after To.");

            RuleFor(x => x.To)
                .Must((query, to) => to!.Value.DayNumber - query.From!.Value.DayNumber + 1 <= DateRangeQuery.MaxDays)
                .When(x => x.From <= x.To)
                .WithMessage($"The range must not be longer than {DateRangeQuery.MaxDays} days.");
        });

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

        RuleFor(x => x.ImageUrls)
            .Must(urls => urls!.Count <= MaxImages)
            .WithMessage($"An item can have at most {MaxImages} images.")
            .When(x => x.ImageUrls is not null);
        RuleForEach(x => x.ImageUrls)
            .NotEmpty()
            .MaximumLength(500)
            .Must(BeHttpUrl)
            .WithMessage("Each image URL must be an absolute http or https URL.");

        // Money is stored with two decimals (numeric(10, 2)), so more would be rounded away.
        RuleFor(x => x.DailyPrice).NotNull().InclusiveBetween(0.01m, 100_000m).PrecisionScale(10, 2, true);
        RuleFor(x => x.Deposit).NotNull().InclusiveBetween(0m, 1_000_000m).PrecisionScale(10, 2, true);
        RuleFor(x => x.LateFeePerDay).NotNull().InclusiveBetween(0m, 100_000m).PrecisionScale(10, 2, true);

        RuleFor(x => x.Specifications)
            .Must(s => s!.Count <= MaxSpecifications)
            .WithMessage($"An item can have at most {MaxSpecifications} specifications.")
            .Must(s => s!.Select(spec => spec?.Key?.Trim()).Distinct().Count() == s!.Count)
            .WithMessage("Each specification key may appear only once.")
            .When(x => x.Specifications is not null);
        RuleForEach(x => x.Specifications).ChildRules(spec =>
        {
            spec.RuleFor(s => s.Key).NotEmpty().Matches(SpecificationKeyPattern)
                .WithMessage("Key must be camelCase letters and digits, e.g. \"cpu\" or \"flightTime\".");
            spec.RuleFor(s => s.Value).NotEmpty().MaximumLength(200);
        });
    }

    public const int MaxSpecifications = 20;
    public const int MaxImages = 8;

    /// <summary>camelCase, 1–40 characters: the key the client translates into a label.</summary>
    public const string SpecificationKeyPattern = "^[a-z][a-zA-Z0-9]{0,39}$";

    private static bool BeHttpUrl(string? url) =>
        Uri.TryCreate(url?.Trim(), UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
