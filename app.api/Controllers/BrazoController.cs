using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Brazo;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrazoController : ControllerBase
    {
        private readonly BrazoDAO BrazoDAO = new BrazoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Brazo, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] string idbahia = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodBahia = ObtenerCodBahia(idbahia);
                if (!string.IsNullOrWhiteSpace(idbahia) && string.IsNullOrWhiteSpace(CodBahia))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var pagina = BrazoDAO.Listado(page, pageSize, search, sort, CodBahia);
                return Ok(pagina.Map(MapBrazo));
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

                var lst = BrazoDAO.Listar();
                return Ok(lst.Select(item => new
                {
                    Value = item.CodBrazo,
                    Text = item.Brazo,
                    item.CodBahia
                }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Brazo, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idbrazo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodBrazo = ObtenerCodBrazo(idbrazo);
                BrazoDTO Brazo = BrazoDAO.Obtener(CodBrazo);

                if (string.IsNullOrWhiteSpace(Brazo.CodBrazo))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapBrazo(Brazo));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Brazo, Permisos.Visualizar)]
        [HttpGet("Archivo")]
        public IActionResult Archivo([FromQuery] string idbrazo, [FromQuery] int codbrazoadjunto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodBrazo = ObtenerCodBrazo(idbrazo);
                BrazoAdjuntoDTO adjunto = BrazoDAO.ObtenerAdjunto(CodBrazo, codbrazoadjunto);

                if (adjunto.CodBrazoAdjunto <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = BrazoDAO.LeerArchivoAdjunto(adjunto);
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
        [RequierePermiso(Menus.Brazo, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] BrazoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = BrazoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Brazo, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] BrazoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = BrazoDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Brazo, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] BrazoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = BrazoDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Brazo, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idbrazo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodBrazo = ObtenerCodBrazo(idbrazo);
                List<BrazoDTO> lst = BrazoDAO.Log(CodBrazo);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string ObtenerCodBrazo(string idbrazo)
        {
            string CodBrazo = Encriptacion.Desencriptar(idbrazo);
            return CodBrazo.Trim();
        }

        private string ObtenerCodBahia(string idbahia)
        {
            if (string.IsNullOrWhiteSpace(idbahia))
                return "";

            string CodBahia = Encriptacion.Desencriptar(idbahia);
            return CodBahia.Trim();
        }

        private object MapBrazo(BrazoDTO brazo)
        {
            return new
            {
                brazo.IdBrazo,
                brazo.CodBrazo,
                brazo.CodBahia,
                brazo.IdBahia,
                brazo.Bahia,
                brazo.CodProducto,
                brazo.IdProducto,
                brazo.Producto,
                brazo.Brazo,
                brazo.Comentario,
                brazo.Estatus,
                brazo.AdjuntoCantidad,
                Adjuntos = (brazo.Adjuntos ?? new List<BrazoAdjuntoDTO>()).Select(adjunto => new
                {
                    adjunto.CodBrazoAdjunto,
                    adjunto.CodBrazo,
                    adjunto.NombreArchivo,
                    adjunto.TipoContenido,
                    adjunto.TamanoBytes,
                    adjunto.RutaArchivo
                })
            };
        }
    }
}


