using Microsoft.AspNetCore.Mvc.Filters;
using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using app.Models.Auditorias;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace app
{
    /// <summary>
    /// Clase para Auditoria
    /// </summary>
    public class AuditoriaSistema : ActionFilterAttribute
    {
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            try
            {
                string Accion = null;
                string Controlador = null;
                // Obtener Accion
                if (((Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor)context.ActionDescriptor).ActionName != null)
                {
                    Accion = ((Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor)context.ActionDescriptor).ActionName;
                }
                // Obtener Controlador
                if (((Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor)context.ActionDescriptor).ControllerName != null)
                {
                    Controlador = ((Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor)context.ActionDescriptor).ControllerName;
                }

                AuditoriaDTO Auditoria = new AuditoriaDTO
                {
                    CodUsuario = ObtenerCodUsuario(context.HttpContext),
                    SesionID = context.HttpContext.Session.Id,
                    IpAddress = context.HttpContext.Connection.RemoteIpAddress.ToString(),
                    PaginaAccedida = context.HttpContext.Request.GetDisplayUrl(),
                    Conectado = DateTime.Now,
                    Metodo = context.HttpContext.Request.Method
                };

                if (Accion == "Salir")
                {
                    Auditoria.Desconectado = DateTime.Now;
                }
                Auditoria.EstadoSesion = "A";
                Auditoria.Controlador = Controlador;
                Auditoria.Accion = Accion;
                AuditoriaDAO AuditoriaDAO = new AuditoriaDAO();

                if (Auditoria.CodUsuario != "")
                {
                    AuditoriaDAO.Agregar(Auditoria);
                }
            }
            catch
            {
                throw;
            }
        }

        private string ObtenerCodUsuario(HttpContext context)
        {
            string codUsuarioSesion = context.Session.GetString("CodUsuario") ?? "";

            if (string.IsNullOrWhiteSpace(codUsuarioSesion))
                return "";

            try
            {
                return ObjEncriptacion.Desencriptar(codUsuarioSesion);
            }
            catch
            {
                return codUsuarioSesion;
            }
        }
    }
}
