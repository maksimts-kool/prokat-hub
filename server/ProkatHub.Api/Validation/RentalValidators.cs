using FluentValidation;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Validation;

/// <summary>The date range rules plus a required, positive item id.</summary>
public sealed class RentalQuoteQueryValidator : DateRangeQueryValidatorBase<RentalQuoteQuery>
{
    public RentalQuoteQueryValidator()
    {
        RuleFor(x => x.ItemId).NotNull().GreaterThan(0);
    }
}

/// <summary>The date range rules plus a required, positive item id.</summary>
public sealed class CreateRentalRequestValidator : DateRangeQueryValidatorBase<CreateRentalRequest>
{
    public CreateRentalRequestValidator()
    {
        RuleFor(x => x.ItemId).NotNull().GreaterThan(0);
    }
}

public sealed class ChangeRentalStatusRequestValidator : AbstractValidator<ChangeRentalStatusRequest>
{
    public const int NoteMaxLength = 500;

    public ChangeRentalStatusRequestValidator()
    {
        RuleFor(x => x.Status).NotNull().IsInEnum();
        RuleFor(x => x.Note).MaximumLength(NoteMaxLength);
    }
}

public sealed class RentalListQueryValidator : AbstractValidator<RentalListQuery>
{
    public RentalListQueryValidator()
    {
        RuleForEach(x => x.Status).IsInEnum();

        RuleFor(x => x.From)
            .LessThanOrEqualTo(x => x.To)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithMessage("From must not be after To.");

        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
