using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Tuberia;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TuberiaController : ControllerBase
    {
        private readonly TuberiaDAO TuberiaDAO = new TuberiaDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Listar)]
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

                var pagina = TuberiaDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapTuberia));
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

                var lst = TuberiaDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Listar)]
        [HttpGet("ResumenProducto")]
        public IActionResult ResumenProducto()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                return Ok(TuberiaDAO.ResumenPorProducto());
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idtuberia)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTuberia = ObtenerCodTuberia(idtuberia);
                TuberiaDTO Tuberia = TuberiaDAO.Obtener(CodTuberia);

                if (string.IsNullOrWhiteSpace(Tuberia.CodTuberia))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapTuberia(Tuberia));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Visualizar)]
        [HttpGet("Archivo")]
        public IActionResult Archivo([FromQuery] string idtuberia, [FromQuery] int codtuberiaadjunto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTuberia = ObtenerCodTuberia(idtuberia);
                TuberiaAdjuntoDTO adjunto = TuberiaDAO.ObtenerAdjunto(CodTuberia, codtuberiaadjunto);

                if (adjunto.CodTuberiaAdjunto <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = TuberiaDAO.LeerArchivoAdjunto(adjunto);
                if (contenido.Length == 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return File(contenido, adjunto.TipoContenido, adjunto.NombreArchivo);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] TuberiaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TuberiaDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] TuberiaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TuberiaDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] TuberiaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TuberiaDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tuberia, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idtuberia)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTuberia = ObtenerCodTuberia(idtuberia);
                List<TuberiaDTO> lst = TuberiaDAO.Log(CodTuberia);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string ObtenerCodTuberia(string idtuberia)
        {
            if (string.IsNullOrWhiteSpace(idtuberia))
                return "";

            try
            {
                return Encriptacion.Desencriptar(idtuberia);
            }
            catch
            {
                return idtuberia;
            }
        }

        private object MapTuberia(TuberiaDTO tuberia)
        {
            return new
            {
                tuberia.IdTuberia,
                tuberia.CodTuberia,
                tuberia.CodTanque,
                tuberia.IdTanque,
                tuberia.Tanque,
                tuberia.CodTipoProducto,
                tuberia.IdTipoProducto,
                tuberia.TipoProducto,
                tuberia.CodProducto,
                tuberia.IdProducto,
                tuberia.Producto,
                tuberia.Ubicacion,
                tuberia.TramoLinea,
                tuberia.Volumen,
                tuberia.FechaCertificacion,
                tuberia.CodCompaniaInspeccion,
                tuberia.IdCompaniaInspeccion,
                tuberia.CompaniaInspeccion,
                tuberia.TipoMovimiento,
                tuberia.Comentario,
                tuberia.Estatus,
                tuberia.AdjuntoCantidad,
                tuberia.DiametroInicio,
                tuberia.DiametroFinal,
                Adjuntos = (tuberia.Adjuntos ?? new List<TuberiaAdjuntoDTO>()).Select(adjunto => new
                {
                    adjunto.CodTuberiaAdjunto,
                    adjunto.CodTuberia,
                    adjunto.NombreArchivo,
                    adjunto.TipoContenido,
                    adjunto.TamanoBytes,
                    adjunto.RutaArchivo
                })
            };
        }
    }
}
