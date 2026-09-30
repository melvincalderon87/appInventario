using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Usuarios;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private UsuarioDAO UsuarioDAO = new UsuarioDAO();
        private Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Usuario, Permisos.Listar)]
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

                var pagina = UsuarioDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapUsuario));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Usuario, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idusuario)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodUsuario = DesencriptarParametro(idusuario);
                UsuarioDTO Usuario = UsuarioDAO.Obtener(CodUsuario);

                if (string.IsNullOrWhiteSpace(Usuario.CodUsuario))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapUsuario(Usuario));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Usuario, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] UsuarioDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj == null ||
                    string.IsNullOrWhiteSpace(Obj.CodUsuario) ||
                    string.IsNullOrWhiteSpace(Obj.Nombre) ||
                    string.IsNullOrWhiteSpace(Obj.Correo) ||
                    string.IsNullOrWhiteSpace(Obj.Password))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, idioma: sesion.Idioma));
                }

                Obj.CodUsuario = Obj.CodUsuario.Trim().ToLowerInvariant();
                Obj.Nombre = Obj.Nombre.Trim();
                Obj.Correo = Obj.Correo.Trim();

                UsuarioDTO existente = UsuarioDAO.Obtener(Obj.CodUsuario);
                if (!string.IsNullOrWhiteSpace(existente.CodUsuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado, idioma: sesion.Idioma));
                }

                MsjDB MsjDB = UsuarioDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Usuario, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] UsuarioDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = UsuarioDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Usuario, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] UsuarioDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = UsuarioDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpPost("CambiarPassword")]
        public IActionResult CambiarPassword([FromBody] CambiarPasswordDTO Obj)
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

                if (string.IsNullOrWhiteSpace(Obj.Password) || Obj.Password != Obj.ConfirmacionPassword)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.PasswordNoCoincide));
                }

                string CodUsuarioSesion = ObjVerificarUsuario.SesionUsuario();
                string CodUsuario = string.IsNullOrWhiteSpace(Obj.IdUsuario)
                    ? CodUsuarioSesion
                    : DesencriptarParametro(Obj.IdUsuario);

                if (string.IsNullOrWhiteSpace(CodUsuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                bool cambiaOtroUsuario = !string.Equals(CodUsuario, CodUsuarioSesion, StringComparison.OrdinalIgnoreCase);
                if (cambiaOtroUsuario && !Accesos.Verificar(Menus.Usuario, Permisos.Editar))
                {
                    return StatusCode(403, ManejadorErrores.SinPermiso(sesion.Idioma));
                }

                MsjDB MsjDB = UsuarioDAO.ActualizarPassword(CodUsuario, Obj.Password);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Usuario, Permisos.Exportar)]
        [HttpGet("Exportar")]
        public IActionResult Exportar([FromQuery] string search = "", [FromQuery] string sort = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (!Accesos.Verificar(Menus.Usuario, Permisos.Exportar))
                {
                    return StatusCode(403, ManejadorErrores.Crear(TipoError.SinPermiso));
                }

                var usuarios = UsuarioDAO.ListadoExportacion(search, sort);
                return Ok(usuarios.Select(MapUsuarioExportacion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Usuario, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idusuario)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodUsuario = DesencriptarParametro(idusuario);
                List<UsuarioDTO> lst = UsuarioDAO.Log(CodUsuario);

                return Ok(lst.Select(usuario => new
                {
                    usuario.IdUsuario,
                    usuario.CodUsuario,
                    usuario.Nombre,
                    usuario.Correo,
                    usuario.Estatus,
                    usuario.Version,
                    usuario.CodUsuarioCreacion,
                    usuario.IdUsuarioCreacion,
                    usuario.FechaCreacion,
                    usuario.CodUsuarioActualizacion,
                    usuario.IdUsuarioActualizacion,
                    usuario.FechaActualizacion
                }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string DesencriptarParametro(string parametro)
        {
            return Encriptacion.Desencriptar(parametro);
        }

        private object MapUsuario(UsuarioDTO usuario)
        {
            return new
            {
                usuario.IdUsuario,
                usuario.CodUsuario,
                usuario.Nombre,
                usuario.Correo,
                usuario.Estatus
            };
        }

        private object MapUsuarioExportacion(UsuarioExportacionDTO usuario)
        {
            return new
            {
                codUsuario = usuario.CodUsuario,
                nombre = usuario.Nombre,
                correo = usuario.Correo,
                estatus = usuario.Estatus,
                tipoUsuario = usuario.TipoUsuario,
                rol = usuario.Rol,
                idioma = usuario.Idioma,
                theme = usuario.Theme
            };
        }
    }
}


