using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Colorante;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ColoranteController : ControllerBase
    {
        private readonly ColoranteDAO ColoranteDAO = new ColoranteDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Colorante, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] string tipomovimiento = "",
            [FromQuery] string idproducto = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodProducto = ObtenerCodProducto(idproducto);

                if (!string.IsNullOrWhiteSpace(idproducto) && string.IsNullOrWhiteSpace(CodProducto))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var pagina = ColoranteDAO.Listado(page, pageSize, search, sort, tipomovimiento, CodProducto);
                return Ok(pagina.Map(MapColorante));
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

                var lst = ColoranteDAO.Listar();
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

                var lst = ColoranteDAO.ListarProductosColorante();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Colorante, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idcolorante)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodDocumento = ObtenerCodDocumento(idcolorante);
                ColoranteDTO Colorante = ColoranteDAO.Obtener(CodDocumento);

                if (Colorante.CodDocumento <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapColorante(Colorante));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Colorante, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] ColoranteDTO Obj)
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

                MsjDB MsjDB = ColoranteDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Colorante, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] ColoranteDTO Obj)
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

                MsjDB MsjDB = ColoranteDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Colorante, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] ColoranteDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = ColoranteDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Colorante, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idcolorante)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodDocumento = ObtenerCodDocumento(idcolorante);
                List<ColoranteDTO> lst = ColoranteDAO.Log(CodDocumento);
                return Ok(lst.Select(MapColoranteLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodDocumento(string idcolorante)
        {
            string valor = Encriptacion.Desencriptar(idcolorante);
            return int.TryParse(valor, out int codDocumento) ? codDocumento : 0;
        }

        private string ObtenerCodProducto(string idproducto)
        {
            if (string.IsNullOrWhiteSpace(idproducto))
                return "";

            string CodProducto = Encriptacion.Desencriptar(idproducto);
            return CodProducto?.Trim() ?? "";
        }

        private string? ValidarCamposRequeridos(ColoranteDTO Obj)
        {
            if (string.IsNullOrWhiteSpace(Obj.CodProducto))
                return "El producto es requerido.";

            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            string tipoMovimiento = (Obj.TipoMovimiento ?? "").Trim().ToUpperInvariant();
            bool esIngreso = tipoMovimiento == "INGRESO" || tipoMovimiento == "AJUSTE";
            bool esSalida = tipoMovimiento == "SALIDA" || tipoMovimiento == "INYECTAR_MANIFOLD" || tipoMovimiento == "PRESTAMO";

            if (tipoMovimiento == "AJUSTE")
            {
                if (Obj.Cantidad == 0)
                    return "La cantidad del ajuste debe ser diferente de cero.";
            }
            else if (Obj.Cantidad <= 0)
            {
                return "La cantidad debe ser mayor a cero.";
            }

            if (!esIngreso && !esSalida)
                return "El tipo de movimiento debe ser ingreso, ajuste, salida, inyección en manifold o préstamo.";

            if (esSalida && Obj.CodBarco > 0 && Obj.CodSuplidor <= 0)
                return "El suplidor es requerido.";

            return null;
        }

        private object MapColorante(ColoranteDTO colorante)
        {
            return new
            {
                colorante.IdColorante,
                colorante.CodDocumento,
                colorante.CodProducto,
                colorante.IdProducto,
                colorante.Producto,
                colorante.TipoProducto,
                colorante.DescripcionCorta,
                colorante.Fecha,
                colorante.TipoMovimiento,
                colorante.CodBarco,
                colorante.IdBarco,
                colorante.Barco,
                colorante.CodSuplidor,
                colorante.IdSuplidor,
                colorante.Suplidor,
                colorante.Cantidad,
                colorante.Comentarios
            };
        }

        private object MapColoranteLog(ColoranteDTO colorante)
        {
            return new
            {
                colorante.IdColorante,
                colorante.CodDocumento,
                colorante.CodProducto,
                colorante.IdProducto,
                colorante.Producto,
                colorante.TipoProducto,
                colorante.DescripcionCorta,
                colorante.Fecha,
                colorante.TipoMovimiento,
                colorante.CodBarco,
                colorante.IdBarco,
                colorante.Barco,
                colorante.CodSuplidor,
                colorante.IdSuplidor,
                colorante.Suplidor,
                colorante.Cantidad,
                colorante.Comentarios,
                colorante.Version,
                colorante.CodUsuarioCreacion,
                colorante.IdUsuarioCreacion,
                colorante.FechaCreacion,
                colorante.CodUsuarioActualizacion,
                colorante.IdUsuarioActualizacion,
                colorante.FechaActualizacion
            };
        }
    }
}


