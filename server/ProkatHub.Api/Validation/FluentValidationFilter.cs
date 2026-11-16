using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace ProkatHub.Api.Validation;

/// <summary>
/// Validates every action argument that has a FluentValidation validator registered in DI.
/// Failures become a 400 ValidationProblemDetails, the same response as a model binding error.
/// </summary>
/// <remarks>
/// Runs after <c>[ApiController]</c> has rejected arguments that could not be bound at all
/// (for example <c>?page=abc</c>), so validators always get a bound object.
/// </remarks>
public sealed class FluentValidationFilter(IOptions<ApiBehaviorOptions> apiBehaviorOptions) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
            {
                continue;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (context.HttpContext.RequestServices.GetService(validatorType) is not IValidator validator)
            {
                continue;
            }

            var result = await validator.ValidateAsync(
                new ValidationContext<object>(argument), context.HttpContext.RequestAborted);
            foreach (var error in result.Errors)
            {
                context.ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
            }
        }

        if (!context.ModelState.IsValid)
        {
            // Same factory as automatic model validation: logs the invalid fields and writes ValidationProblemDetails.
            context.Result = apiBehaviorOptions.Value.InvalidModelStateResponseFactory(context);
            return;
        }

        await next();
    }
}
