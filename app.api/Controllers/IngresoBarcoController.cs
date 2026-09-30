using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.IngresoBarco;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IngresoBarcoController : ControllerBase
    {
        private readonly IngresoBarcoDAO IngresoBarcoDAO = new IngresoBarcoDAO();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.IngresoBarco, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado)
                return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

            return Ok(IngresoBarcoDAO.Listado(page, pageSize, search, sort));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.IngresoBarco, Permisos.Editar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] int codigo)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado)
                return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

            IngresoBarcoDTO ingreso = IngresoBarcoDAO.Obtener(codigo);
            if (ingreso.CodIngresoBarco <= 0)
                return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

            return Ok(ingreso);
        }

        [AuditoriaSistema]
        [HttpGet("ListarProductoOpcion")]
        public IActionResult ListarProductoOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                // El formulario se utiliza tanto al crear como al editar un ingreso.
                if (!Accesos.Verificar(Menus.IngresoBarco, Permisos.Agregar)
                    && !Accesos.Verificar(Menus.IngresoBarco, Permisos.Editar))
                    return StatusCode(403, ManejadorErrores.SinPermiso(sesion.Idioma));

                return Ok(IngresoBarcoDAO.ListarProductosCombustible().Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.IngresoBarco, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] IngresoBarcoDTO Obj)
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

                MsjDB MsjDB = IngresoBarcoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.IngresoBarco, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] IngresoBarcoDTO Obj)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado)
                return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

            string? validacion = ValidarCamposRequeridos(Obj);
            if (!string.IsNullOrWhiteSpace(validacion))
                return BadRequest(ManejadorErrores.Validacion(validacion));

            return Ok(IngresoBarcoDAO.Editar(Obj));
        }

        private string? ValidarCamposRequeridos(IngresoBarcoDTO Obj)
        {
            if (Obj.CodBarco <= 0)
                return "El barco es requerido.";

            if (!Obj.FechaIngreso.HasValue)
                return "La fecha de ingreso es requerida.";

            if (string.IsNullOrWhiteSpace(Obj.CodigoInterno))
                return "El codigo interno es requerido.";

            if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                return "Debe agregar al menos una fila al detalle del ingreso.";

            foreach (IngresoBarcoDetalleDTO detalle in Obj.Detalles)
            {
                if (detalle.CodSuplidor <= 0)
                    return "El suplidor es requerido en todas las filas.";

                if (detalle.CodProducto <= 0)
                    return "El producto es requerido en todas las filas.";

                if (detalle.CantidadEstandar <= 0)
                    return "La cantidad estandar debe ser mayor a cero en todas las filas.";
            }

            return null;
        }
    }
}


