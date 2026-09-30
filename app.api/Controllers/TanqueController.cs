using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Tanque;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TanqueController : ControllerBase
    {
        private readonly TanqueDAO TanqueDAO = new TanqueDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tanque, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] bool? consumopropio = null,
            [FromQuery] string tipoproducto = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var pagina = TanqueDAO.Listado(page, pageSize, search, sort, consumopropio, tipoproducto);
                return Ok(pagina.Map(MapTanque));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarOpcion")]
        public IActionResult ListarOpcion(
            [FromQuery] bool? consumopropio = null,
            [FromQuery] string tipoproducto = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = TanqueDAO.Listar(consumopropio, tipoproducto);
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tanque, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idtanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTanque = ObtenerCodTanque(idtanque);
                TanqueDTO Tanque = TanqueDAO.Obtener(CodTanque);

                if (string.IsNullOrWhiteSpace(Tanque.CodTanque))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapTanque(Tanque));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tanque, Permisos.Visualizar)]
        [HttpGet("Archivo")]
        public IActionResult Archivo([FromQuery] string idtanque, [FromQuery] int codtanqueadjunto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTanque = ObtenerCodTanque(idtanque);
                TanqueAdjuntoDTO adjunto = TanqueDAO.ObtenerAdjunto(CodTanque, codtanqueadjunto);

                if (adjunto.CodTanqueAdjunto <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = TanqueDAO.LeerArchivoAdjunto(adjunto);
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
        [RequierePermiso(Menus.Tanque, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] TanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TanqueDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tanque, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] TanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TanqueDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tanque, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] TanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TanqueDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tanque, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idtanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTanque = ObtenerCodTanque(idtanque);
                List<TanqueDTO> lst = TanqueDAO.Log(CodTanque);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string ObtenerCodTanque(string idtanque)
        {
            string CodTanque = Encriptacion.Desencriptar(idtanque);
            return CodTanque.Trim();
        }

        private object MapTanque(TanqueDTO tanque)
        {
            return new
            {
                tanque.IdTanque,
                tanque.CodTanque,
                tanque.CodProducto,
                tanque.IdProducto,
                tanque.Producto,
                tanque.TipoTanque,
                tanque.Tanque,
                tanque.DescripcionCorta,
                tanque.Mencod,
                tanque.AlturaMaximaPies,
                tanque.AlturaMaximaPulgadas,
                tanque.TipoPosiconTecho,
                tanque.AlturaMinimaPies,
                tanque.AlturaMinimaPulgadas,
                tanque.VolumenMaximo,
                tanque.VolumenMinimo,
                tanque.VolumenTechoPosicionAlta,
                tanque.VolumenTechoPosicionBaja,
                tanque.Proveedor,
                tanque.ConsumoPropio,
                tanque.Comentario,
                tanque.Estatus,
                tanque.AdjuntoCantidad,
                Adjuntos = (tanque.Adjuntos ?? new List<TanqueAdjuntoDTO>()).Select(adjunto => new
                {
                    adjunto.CodTanqueAdjunto,
                    adjunto.CodTanque,
                    adjunto.NombreArchivo,
                    adjunto.TipoContenido,
                    adjunto.TamanoBytes,
                    adjunto.RutaArchivo
                })
            };
        }
    }
}


