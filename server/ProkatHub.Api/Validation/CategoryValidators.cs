using FluentValidation;
using ProkatHub.Api.Dtos;

namespace ProkatHub.Api.Validation;

public sealed class CategoryRequestValidator : AbstractValidator<CategoryRequest>
{
    public CategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().Length(2, 100);

        // A blank slug is allowed: the service makes one from the name.
        RuleFor(x => x.Slug)
            .MaximumLength(100)
            .Matches(CategoryRequest.SlugPattern)
            .WithMessage("Slug may contain only lower-case letters, digits and single hyphens.")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug));

        RuleFor(x => x.Description).MaximumLength(500);
    }
}
