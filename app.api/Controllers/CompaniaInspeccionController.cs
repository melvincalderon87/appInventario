using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.CompaniaInspeccion;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompaniaInspeccionController : ControllerBase
    {
        private readonly CompaniaInspeccionDAO CompaniaInspeccionDAO = new CompaniaInspeccionDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompaniaInspeccion, Permisos.Listar)]
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

                var pagina = CompaniaInspeccionDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapCompaniaInspeccion));
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

                var lst = CompaniaInspeccionDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompaniaInspeccion, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idcompaniainspeccion)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCompaniaInspeccion = ObtenerCodCompaniaInspeccion(idcompaniainspeccion);
                CompaniaInspeccionDTO CompaniaInspeccion = CompaniaInspeccionDAO.Obtener(CodCompaniaInspeccion);

                if (CompaniaInspeccion.CodCompaniaInspeccion <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapCompaniaInspeccion(CompaniaInspeccion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompaniaInspeccion, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] CompaniaInspeccionDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = CompaniaInspeccionDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompaniaInspeccion, Permisos.Visualizar)]
        [HttpGet("Archivo")]
        public IActionResult Archivo([FromQuery] string idcompaniainspeccion, [FromQuery] int codcompaniainspeccionadjunto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCompaniaInspeccion = ObtenerCodCompaniaInspeccion(idcompaniainspeccion);
                CompaniaInspeccionAdjuntoDTO adjunto = CompaniaInspeccionDAO.ObtenerAdjunto(CodCompaniaInspeccion, codcompaniainspeccionadjunto);

                if (adjunto.CodCompaniaInspeccionAdjunto <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = CompaniaInspeccionDAO.LeerArchivoAdjunto(adjunto);
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
        [RequierePermiso(Menus.CompaniaInspeccion, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] CompaniaInspeccionDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = CompaniaInspeccionDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompaniaInspeccion, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] CompaniaInspeccionDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = CompaniaInspeccionDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompaniaInspeccion, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idcompaniainspeccion)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCompaniaInspeccion = ObtenerCodCompaniaInspeccion(idcompaniainspeccion);
                List<CompaniaInspeccionDTO> lst = CompaniaInspeccionDAO.Log(CodCompaniaInspeccion);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodCompaniaInspeccion(string idcompaniainspeccion)
        {
            if (int.TryParse(idcompaniainspeccion, out int valorDirecto))
                return valorDirecto;

            string CodCompaniaInspeccion = Encriptacion.Desencriptar(idcompaniainspeccion);
            return int.TryParse(CodCompaniaInspeccion, out int valor) ? valor : 0;
        }

        private object MapCompaniaInspeccion(CompaniaInspeccionDTO companiaInspeccion)
        {
            return new
            {
                companiaInspeccion.IdCompaniaInspeccion,
                companiaInspeccion.CodCompaniaInspeccion,
                companiaInspeccion.NombreComercial,
                companiaInspeccion.NombreFiscal,
                companiaInspeccion.Nit,
                companiaInspeccion.Estatus,
                companiaInspeccion.AdjuntoCantidad,
                Adjuntos = (companiaInspeccion.Adjuntos ?? new List<CompaniaInspeccionAdjuntoDTO>()).Select(adjunto => new
                {
                    adjunto.CodCompaniaInspeccionAdjunto,
                    adjunto.CodCompaniaInspeccion,
                    adjunto.NombreArchivo,
                    adjunto.TipoContenido,
                    adjunto.TamanoBytes,
                    adjunto.RutaArchivo
                })
            };
        }
    }
}
