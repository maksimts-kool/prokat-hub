using FluentValidation;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Validation;

public sealed class PopularItemsQueryValidator : AbstractValidator<PopularItemsQuery>
{
    public PopularItemsQueryValidator()
    {
        RuleFor(x => x.Top).InclusiveBetween(1, PopularItemsQuery.MaxTop);

        RuleFor(x => x.To)
            .NotNull()
            .When(x => x.From.HasValue)
            .WithMessage("To is required when From is given.");
        RuleFor(x => x.From)
            .NotNull()
            .When(x => x.To.HasValue)
            .WithMessage("From is required when To is given.");
        RuleFor(x => x.From)
            .LessThanOrEqualTo(x => x.To)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithMessage("From must not be after To.");
    }
}
