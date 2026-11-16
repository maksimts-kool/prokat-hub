using FluentValidation.TestHelper;
using ProkatHub.Api.Domain;
using ProkatHub.Api.Dtos;
using ProkatHub.Api.Validation;

namespace ProkatHub.Tests.Validation;

public class ChangeRentalStatusRequestValidatorTests
{
    private readonly ChangeRentalStatusRequestValidator _validator = new();

    [Fact]
    public void Status_is_required()
    {
        _validator.TestValidate(new ChangeRentalStatusRequest())
            .ShouldHaveValidationErrorFor(x => x.Status)
            .Only();
    }

    [Fact]
    public void Status_must_be_a_known_value()
    {
        _validator.TestValidate(new ChangeRentalStatusRequest { Status = (RentalStatus)42 })
            .ShouldHaveValidationErrorFor(x => x.Status);
    }

    [Fact]
    public void Note_has_a_length_limit()
    {
        var note = new string('x', ChangeRentalStatusRequestValidator.NoteMaxLength + 1);

        _validator.TestValidate(new ChangeRentalStatusRequest { Status = RentalStatus.Returned, Note = note })
            .ShouldHaveValidationErrorFor(x => x.Note)
            .Only();
    }

    [Fact]
    public void Status_with_a_note_is_valid()
    {
        _validator.TestValidate(new ChangeRentalStatusRequest { Status = RentalStatus.Issued, Note = "Serial checked" })
            .ShouldNotHaveAnyValidationErrors();
    }
}

public class RentalListQueryValidatorTests
{
    private readonly RentalListQueryValidator _validator = new();

    [Fact]
    public void Empty_query_is_valid()
    {
        _validator.TestValidate(new RentalListQuery()).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void From_must_not_be_after_to()
    {
        _validator.TestValidate(new RentalListQuery { From = new(2026, 12, 5), To = new(2026, 12, 1) })
            .ShouldHaveValidationErrorFor(x => x.From)
            .Only();
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(1, 0)]
    [InlineData(1, 101)]
    public void Page_and_page_size_are_bounded(int page, int pageSize)
    {
        var result = _validator.TestValidate(new RentalListQuery { Page = page, PageSize = pageSize });

        Assert.Single(result.Errors);
    }
}
