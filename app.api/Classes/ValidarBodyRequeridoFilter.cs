using app.Messages;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace app
{
    public class ValidarBodyRequeridoFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!HttpMethods.IsPost(context.HttpContext.Request.Method))
            {
                return;
            }

            foreach (ControllerParameterDescriptor parameter in context.ActionDescriptor.Parameters.OfType<ControllerParameterDescriptor>())
            {
                bool esBody = parameter.ParameterInfo
                    .GetCustomAttributes(typeof(FromBodyAttribute), inherit: true)
                    .Any();

                if (!esBody)
                {
                    continue;
                }

                if (!context.ActionArguments.TryGetValue(parameter.Name, out object? valor) || valor == null)
                {
                    context.Result = new BadRequestObjectResult(
                        ManejadorErrores.Crear(TipoError.ParametrosRequeridos)
                    );
                    return;
                }
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }
    }
}
