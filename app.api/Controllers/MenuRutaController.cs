using app.Messages;
using app.Models.MenuRuta;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuRutaController : ControllerBase
    {
        private readonly MenuRutaDAO MenuRutaDAO = new MenuRutaDAO();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuRuta, Permisos.Listar)]
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

                var pagina = MenuRutaDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapMenuRuta));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuRuta, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string ruta)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MenuRutaDTO menuRuta = MenuRutaDAO.Obtener(ruta);
                if (string.IsNullOrWhiteSpace(menuRuta.Ruta))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapMenuRuta(menuRuta));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuRuta, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] MenuRutaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string? validationMessage = ValidarCamposRequeridos(Obj);
                if (validationMessage != null)
                {
                    return BadRequest(ManejadorErrores.Validacion(validationMessage));
                }

                if (MenuRutaDAO.VerificarRuta(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado));
                }

                MsjDB MsjDB = MenuRutaDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuRuta, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] MenuRutaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string? validationMessage = ValidarCamposRequeridos(Obj);
                if (validationMessage != null)
                {
                    return BadRequest(ManejadorErrores.Validacion(validationMessage));
                }

                MsjDB MsjDB = MenuRutaDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuRuta, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] MenuRutaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (string.IsNullOrWhiteSpace(Obj.Ruta))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                MsjDB MsjDB = MenuRutaDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuRuta, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string ruta)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                List<MenuRutaDTO> lst = MenuRutaDAO.Log(ruta);
                return Ok(lst.Select(MapMenuRutaLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private object MapMenuRuta(MenuRutaDTO menuRuta)
        {
            return new
            {
                menuRuta.Ruta,
                menuRuta.CodMenu,
                menuRuta.MenuDescripcion,
                menuRuta.CodTipoPermiso,
                menuRuta.TipoPermisoDescripcion,
                menuRuta.Estatus
            };
        }

        private object MapMenuRutaLog(MenuRutaDTO menuRuta)
        {
            return new
            {
                menuRuta.Ruta,
                menuRuta.CodMenu,
                menuRuta.MenuDescripcion,
                menuRuta.CodTipoPermiso,
                menuRuta.TipoPermisoDescripcion,
                menuRuta.Estatus,
                menuRuta.Version,
                menuRuta.CodUsuarioCreacion,
                menuRuta.IdUsuarioCreacion,
                menuRuta.FechaCreacion,
                menuRuta.CodUsuarioActualizacion,
                menuRuta.IdUsuarioActualizacion,
                menuRuta.FechaActualizacion
            };
        }

        private string? ValidarCamposRequeridos(MenuRutaDTO Obj)
        {
            if (Obj == null)
            {
                return "La ruta es requerida.";
            }

            if (string.IsNullOrWhiteSpace(Obj.Ruta))
            {
                return "La ruta es requerida.";
            }

            if (Obj.CodMenu <= 0)
            {
                return "El menu es requerido.";
            }

            if (Obj.CodTipoPermiso <= 0)
            {
                return "El tipo de permiso es requerido.";
            }

            return null;
        }
    }
}


