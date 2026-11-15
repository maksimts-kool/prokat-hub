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
