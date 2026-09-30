using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.IngresoTuberias;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IngresoTuberiasController : ControllerBase
    {
        private readonly IngresoTuberiasDAO IngresoTuberiasDAO = new IngresoTuberiasDAO();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.IngresoTuberias, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return Ok(IngresoTuberiasDAO.Listado(page, pageSize, search, sort));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.IngresoTuberias, Permisos.Agregar)]
        [HttpGet("ListarProductoOpcion")]
        public IActionResult ListarProductoOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                return Ok(IngresoTuberiasDAO.ListarProductosCombustible().Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.IngresoTuberias, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] IngresoTuberiasDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = IngresoTuberiasDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string? ValidarCamposRequeridos(IngresoTuberiasDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            if (Obj.CodBarco <= 0)
                return "El barco es requerido.";

            if (Obj.CodSuplidor <= 0)
                return "El suplidor es requerido.";

            if (Obj.CodProducto <= 0)
                return "El producto es requerido.";

            if (Obj.CantidadEstandar <= 0)
                return "La cantidad estandar debe ser mayor a cero.";

            if (Obj.CantidadAmbiente <= 0)
                return "La cantidad ambiente debe ser mayor a cero.";

            return null;
        }
    }
}


