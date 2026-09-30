using app.Messages;
using app.Models.MenuIdioma;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuIdiomaController : ControllerBase
    {
        private readonly MenuIdiomaDAO MenuIdiomaDAO = new MenuIdiomaDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuIdioma, Permisos.Listar)]
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

                var pagina = MenuIdiomaDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapMenuIdioma));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuIdioma, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idmenuidioma)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var clave = ObtenerClave(idmenuidioma);
                if (clave is null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                MenuIdiomaDTO menuIdioma = MenuIdiomaDAO.Obtener(clave.Value.CodMenu, clave.Value.Idioma);
                if (menuIdioma.CodMenu <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapMenuIdioma(menuIdioma));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuIdioma, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] MenuIdiomaDTO Obj)
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

                if (Obj.CodMenu <= 0 || string.IsNullOrWhiteSpace(Obj.Idioma) || string.IsNullOrWhiteSpace(Obj.Descripcion))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                if (MenuIdiomaDAO.VerificarDuplicado(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado));
                }

                MsjDB msj = MenuIdiomaDAO.Agregar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuIdioma, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] MenuIdiomaDTO Obj)
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

                if (Obj.CodMenu <= 0 || string.IsNullOrWhiteSpace(Obj.Idioma) || string.IsNullOrWhiteSpace(Obj.Descripcion))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                MsjDB msj = MenuIdiomaDAO.Editar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuIdioma, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] MenuIdiomaDTO Obj)
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

                if (Obj.CodMenu <= 0 || string.IsNullOrWhiteSpace(Obj.Idioma))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                MsjDB msj = MenuIdiomaDAO.Eliminar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MenuIdioma, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idmenuidioma)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var clave = ObtenerClave(idmenuidioma);
                if (clave is null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var lst = MenuIdiomaDAO.Log(clave.Value.CodMenu, clave.Value.Idioma);
                return Ok(lst.Select(MapMenuIdioma));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private (int CodMenu, string Idioma)? ObtenerClave(string idmenuidioma)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(idmenuidioma))
                    return null;

                string valor = Encriptacion.Desencriptar(idmenuidioma);
                string[] partes = valor.Split('|');
                if (partes.Length != 2)
                    return null;

                if (!int.TryParse(partes[0], out int codMenu))
                    return null;

                string idioma = partes[1];
                if (string.IsNullOrWhiteSpace(idioma))
                    return null;

                return (codMenu, idioma);
            }
            catch
            {
                return null;
            }
        }

        private object MapMenuIdioma(MenuIdiomaDTO Obj)
        {
            return new
            {
                idMenuIdioma = Obj.IdMenuIdioma,
                codMenu = Obj.CodMenu,
                idioma = Obj.Idioma,
                descripcion = Obj.Descripcion,
                version = Obj.Version,
                codUsuarioCreacion = Obj.CodUsuarioCreacion,
                idUsuarioCreacion = Obj.IdUsuarioCreacion,
                fechaCreacion = Obj.FechaCreacion,
                codUsuarioActualizacion = Obj.CodUsuarioActualizacion,
                idUsuarioActualizacion = Obj.IdUsuarioActualizacion,
                fechaActualizacion = Obj.FechaActualizacion,
            };
        }
    }
}


