using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Barco;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BarcoController : ControllerBase
    {
        private readonly BarcoDAO BarcoDAO = new BarcoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Barco, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var pagina = BarcoDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapBarco));
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

                var lst = BarcoDAO.Listar();
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
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                return Ok(BarcoDAO.ListarProductosCombustible().Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("BuscarOpcion")]
        public IActionResult BuscarOpcion([FromQuery] string search = "", [FromQuery] int limite = 20)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = BarcoDAO.BuscarOpcion(search, limite);
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarIngresadosRecientementeOpcion")]
        public IActionResult ListarIngresadosRecientementeOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = BarcoDAO.ListarIngresadosRecientemente();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarFechaPrevistaUltimosDosMesesOpcion")]
        public IActionResult ListarFechaPrevistaUltimosDosMesesOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = BarcoDAO.ListarFechaPrevistaUltimosDosMeses();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Barco, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idbarco)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodBarco = ObtenerCodBarco(idbarco);
                BarcoDTO Barco = BarcoDAO.Obtener(CodBarco);

                if (Barco.CodBarco <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapBarco(Barco));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Barco, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] BarcoDTO Obj)
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

                MsjDB MsjDB = BarcoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Barco, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] BarcoDTO Obj)
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

                MsjDB MsjDB = BarcoDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Barco, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] BarcoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = BarcoDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Barco, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idbarco)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodBarco = ObtenerCodBarco(idbarco);
                List<BarcoDTO> lst = BarcoDAO.Log(CodBarco);
                return Ok(lst.Select(MapBarcoLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodBarco(string idbarco)
        {
            string CodBarco = Encriptacion.Desencriptar(idbarco);
            return int.TryParse(CodBarco, out int valor) ? valor : 0;
        }

        private string? ValidarCamposRequeridos(BarcoDTO Obj)
        {
            if (string.IsNullOrWhiteSpace(Obj.Barco))
                return "El nombre del barco es requerido.";

            if (!Obj.FechaPrevista.HasValue)
                return "La fecha prevista es requerida.";

            if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                return "Debe agregar al menos una fila al detalle del barco.";

            foreach (BarcoDetalleDTO detalle in Obj.Detalles)
            {
                if (detalle.CodSuplidor <= 0)
                    return "El suplidor es requerido en todas las filas.";

                if (detalle.CodProducto <= 0)
                    return "El producto es requerido en todas las filas.";

                if (detalle.Cantidad <= 0)
                    return "La cantidad debe ser mayor a cero en todas las filas.";
            }

            return null;
        }

        private object MapBarco(BarcoDTO barco)
        {
            return new
            {
                barco.IdBarco,
                barco.CodBarco,
                barco.Barco,
                barco.FechaPrevista,
                barco.Comentario,
                barco.CantidadTotal,
                barco.DetalleCantidad,
                Detalles = barco.Detalles.Select(MapBarcoDetalle)
            };
        }

        private object MapBarcoDetalle(BarcoDetalleDTO detalle)
        {
            return new
            {
                detalle.CodBarco,
                detalle.Linea,
                detalle.CodSuplidor,
                detalle.IdSuplidor,
                detalle.Suplidor,
                detalle.CodProducto,
                detalle.IdProducto,
                detalle.Producto,
                detalle.Cantidad
            };
        }

        private object MapBarcoLog(BarcoDTO barco)
        {
            return new
            {
                barco.IdBarco,
                barco.CodBarco,
                barco.Barco,
                barco.FechaPrevista,
                barco.Comentario,
                barco.Version,
                barco.CodUsuarioCreacion,
                barco.IdUsuarioCreacion,
                barco.FechaCreacion,
                barco.CodUsuarioActualizacion,
                barco.IdUsuarioActualizacion,
                barco.FechaActualizacion
            };
        }
    }
}


