using app.Messages;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace app
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class RequierePermisoAttribute : Attribute, IAuthorizationFilter
    {
        private readonly Menus _codMenu;
        private readonly Permisos _codTipoPermiso;

        public RequierePermisoAttribute(Menus codMenu, Permisos codTipoPermiso)
        {
            _codMenu = codMenu;
            _codTipoPermiso = codTipoPermiso;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            VerificarUsuario verificarUsuario = new VerificarUsuario();
            var sesion = verificarUsuario.ObtenerSesion();

            if (!sesion.Autenticado)
            {
                context.Result = new UnauthorizedObjectResult(
                    ManejadorErrores.NoAutorizado(sesion.Idioma)
                );
                return;
            }

            if (!Accesos.Verificar(_codMenu, _codTipoPermiso))
            {
                context.Result = new ObjectResult(
                    ManejadorErrores.SinPermiso(sesion.Idioma)
                )
                {
                    StatusCode = StatusCodes.Status403Forbidden
                };
            }
        }
    }
}
