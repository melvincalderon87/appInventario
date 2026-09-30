using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.TipoPermisos;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TipoPermisoController : ControllerBase
    {
        private readonly TipoPermisoDAO TipoPermisoDAO = new TipoPermisoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoPermiso, Permisos.Listar)]
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

                var pagina = TipoPermisoDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapTipoPermiso));
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

                var lst = TipoPermisoDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoPermiso, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idtipopermiso)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodTipoPermiso = ObtenerCodTipoPermiso(idtipopermiso);
                TipoPermisoDTO TipoPermiso = TipoPermisoDAO.Obtener(CodTipoPermiso);
                if (TipoPermiso.CodTipoPermiso <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapTipoPermiso(TipoPermiso));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoPermiso, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] TipoPermisoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj == null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ParametrosRequeridos));
                }

                if (string.IsNullOrWhiteSpace(Obj.Descripcion))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                if (TipoPermisoDAO.VerificarDescripcion(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado));
                }

                MsjDB msj = TipoPermisoDAO.Agregar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoPermiso, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] TipoPermisoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj == null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ParametrosRequeridos));
                }

                if (Obj.CodTipoPermiso <= 0 || string.IsNullOrWhiteSpace(Obj.Descripcion))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                MsjDB msj = TipoPermisoDAO.Editar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoPermiso, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] TipoPermisoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj == null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ParametrosRequeridos));
                }

                if (Obj.CodTipoPermiso <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                MsjDB msj = TipoPermisoDAO.Eliminar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoPermiso, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idtipopermiso)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodTipoPermiso = ObtenerCodTipoPermiso(idtipopermiso);
                List<TipoPermisoDTO> lst = TipoPermisoDAO.Log(CodTipoPermiso);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodTipoPermiso(string idtipopermiso)
        {
            string CodTipoPermiso = Encriptacion.Desencriptar(idtipopermiso);
            return int.TryParse(CodTipoPermiso, out int valor) ? valor : 0;
        }

        private object MapTipoPermiso(TipoPermisoDTO TipoPermiso)
        {
            return new
            {
                idTipoPermiso = TipoPermiso.IdTipoPermiso,
                codTipoPermiso = TipoPermiso.CodTipoPermiso,
                descripcion = TipoPermiso.Descripcion,
            };
        }
    }
}


