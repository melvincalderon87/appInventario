using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Aditivo;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AditivoController : ControllerBase
    {
        private readonly AditivoDAO AditivoDAO = new AditivoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Aditivo, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] string tipomovimiento = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var pagina = AditivoDAO.Listado(page, pageSize, search, sort, tipomovimiento);
                return Ok(pagina.Map(MapAditivo));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarOpcion")]
        public IActionResult ListarOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = AditivoDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarProductoOpcion")]
        public IActionResult ListarProductoOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = AditivoDAO.ListarProductosAditivo();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Aditivo, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idaditivo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodDocumento = ObtenerCodDocumento(idaditivo);
                AditivoDTO Aditivo = AditivoDAO.Obtener(CodDocumento);

                if (Aditivo.CodDocumento <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapAditivo(Aditivo));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Aditivo, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] AditivoDTO Obj)
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

                MsjDB MsjDB = AditivoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Aditivo, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] AditivoDTO Obj)
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

                MsjDB MsjDB = AditivoDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Aditivo, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] AditivoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = AditivoDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Aditivo, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idaditivo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodDocumento = ObtenerCodDocumento(idaditivo);
                List<AditivoDTO> lst = AditivoDAO.Log(CodDocumento);
                return Ok(lst.Select(MapAditivoLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodDocumento(string idaditivo)
        {
            string CodDocumento = Encriptacion.Desencriptar(idaditivo);
            return int.TryParse(CodDocumento, out int valor) ? valor : 0;
        }

        private string? ValidarCamposRequeridos(AditivoDTO Obj)
        {
            string tipoMovimiento = (Obj.TipoMovimiento ?? "").Trim().ToUpperInvariant();
            if (tipoMovimiento != "INGRESO" && tipoMovimiento != "SALIDA")
                return "El tipo de movimiento debe ser ingreso o salida.";

            if (Obj.Cantidad <= 0)
                return "La cantidad debe ser mayor a cero.";

            if ((Obj.Comentario ?? "").Trim().Length > 250)
                return "El comentario debe tener maximo 250 caracteres.";

            if (tipoMovimiento == "SALIDA")
                return null;

            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            if (Obj.CodSuplidor <= 0)
                return "El suplidor es requerido.";

            if (Obj.CodProducto <= 0)
                return "El producto es requerido.";

            if (string.IsNullOrWhiteSpace(Obj.CodTanque))
                return "El tanque es requerido.";

            return null;
        }

        private object MapAditivo(AditivoDTO aditivo)
        {
            return new
            {
                aditivo.IdAditivo,
                aditivo.CodDocumento,
                aditivo.CodSuplidor,
                aditivo.IdSuplidor,
                aditivo.Suplidor,
                aditivo.CodProducto,
                aditivo.IdProducto,
                aditivo.Producto,
                aditivo.CodTanque,
                aditivo.IdTanque,
                aditivo.Tanque,
                aditivo.Fecha,
                aditivo.TipoMovimiento,
                aditivo.Cantidad,
                aditivo.Comentario
            };
        }

        private object MapAditivoLog(AditivoDTO aditivo)
        {
            return new
            {
                aditivo.IdAditivo,
                aditivo.CodDocumento,
                aditivo.CodSuplidor,
                aditivo.IdSuplidor,
                aditivo.Suplidor,
                aditivo.CodProducto,
                aditivo.IdProducto,
                aditivo.Producto,
                aditivo.CodTanque,
                aditivo.IdTanque,
                aditivo.Tanque,
                aditivo.Fecha,
                aditivo.TipoMovimiento,
                aditivo.Cantidad,
                aditivo.Comentario,
                aditivo.Version,
                aditivo.CodUsuarioCreacion,
                aditivo.IdUsuarioCreacion,
                aditivo.FechaCreacion,
                aditivo.CodUsuarioActualizacion,
                aditivo.IdUsuarioActualizacion,
                aditivo.FechaActualizacion
            };
        }
    }
}


