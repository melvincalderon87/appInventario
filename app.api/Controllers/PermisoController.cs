using app.Messages;
using app.Models.Permiso;
using app.Models.Roles;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PermisoController : ControllerBase
    {
        private readonly PermisoDAO PermisoDAO = new PermisoDAO();
        private readonly RolDAO RolDAO = new RolDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Permiso, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] string idrol,
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

                int CodRol = ObtenerCodRol(idrol);
                RolDTO Rol = RolDAO.Obtener(CodRol);

                if (Rol.CodRol <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                var pagina = PermisoDAO.ListadoPorRol(CodRol, page, pageSize, search, sort);
                return Ok(pagina.Map(MapPermisoRol));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Permiso, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idrol, [FromQuery] string idmenu)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodRol = ObtenerCodRol(idrol);
                int CodMenu = ObtenerCodMenu(idmenu);

                if (CodRol <= 0 || CodMenu <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                List<PermisoDTO> lst = PermisoDAO.Log(CodRol, CodMenu);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Permiso, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] PermisoRolDTO Obj_)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj_ == null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ParametrosRequeridos));
                }

                if (Obj_.CodRol <= 0 || Obj_.CodMenu <= 0 || Obj_.CodTipoPermiso <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                PermisoDTO Obj = new PermisoDTO
                {
                    CodRol = Obj_.CodRol,
                    CodMenu = Obj_.CodMenu,
                    CodTipoPermiso = Obj_.CodTipoPermiso,
                };

                if (ExistePermiso(Obj))
                {
                    return Ok(new MsjDB
                    {
                        Estatus = true,
                        Msj = "El permiso ya se encuentra asignado.",
                        Key = Obj_.CodRol
                    });
                }

                MsjDB msj = PermisoDAO.Agregar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Permiso, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] PermisoRolDTO Obj_)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj_ == null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ParametrosRequeridos));
                }

                if (Obj_.CodRol <= 0 || Obj_.CodMenu <= 0 || Obj_.CodTipoPermiso <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                PermisoDTO Obj = new PermisoDTO
                {
                    CodRol = Obj_.CodRol,
                    CodMenu = Obj_.CodMenu,
                    CodTipoPermiso = Obj_.CodTipoPermiso,
                };

                if (!ExistePermiso(Obj))
                {
                    return Ok(new MsjDB
                    {
                        Estatus = true,
                        Msj = "El permiso ya no se encontraba asignado.",
                        Key = Obj_.CodRol
                    });
                }

                MsjDB msj = PermisoDAO.Eliminar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private bool ExistePermiso(PermisoDTO Obj)
        {
            return PermisoDAO.Verificar(Obj.CodRol, (Menus)Obj.CodMenu, (Permisos)Obj.CodTipoPermiso);
        }

        private int ObtenerCodRol(string idrol)
        {
            string CodRol = Encriptacion.Desencriptar(idrol);
            return int.TryParse(CodRol, out int valor) ? valor : 0;
        }

        private int ObtenerCodMenu(string idmenu)
        {
            string CodMenu = Encriptacion.Desencriptar(idmenu);
            return int.TryParse(CodMenu, out int valor) ? valor : 0;
        }

        private object MapPermisoRol(PermisoRolDTO Obj)
        {
            return new
            {
                idRol = Obj.IdRol,
                codRol = Obj.CodRol,
                rolDescripcion = Obj.RolDescripcion,
                codMenu = Obj.CodMenu,
                idMenu = Obj.IdMenu,
                menuDescripcion = Obj.MenuDescripcion,
                codTipoPermiso = Obj.CodTipoPermiso,
                tipoPermisoDescripcion = Obj.TipoPermisoDescripcion,
                asignado = Obj.Asignado,
            };
        }
    }
}


