using app.Messages;
using app.Models.UsuarioConfiguraciones;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioConfiguracionController : ControllerBase
    {
        private readonly UsuarioConfiguracionDAO UsuarioConfiguracionDAO = new UsuarioConfiguracionDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] string idusuario,
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

                if (string.IsNullOrWhiteSpace(idusuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                string CodUsuario = DesencriptarParametro(idusuario);
                if (string.IsNullOrWhiteSpace(CodUsuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var pagina = UsuarioConfiguracionDAO.Listado(CodUsuario, page, pageSize, search, sort);
                return Ok(pagina.Map(MapUsuarioConfiguracion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Visualizar)]
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

                if (string.IsNullOrWhiteSpace(idusuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                string CodUsuario = DesencriptarParametro(idusuario);
                if (string.IsNullOrWhiteSpace(CodUsuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                UsuarioConfiguracionDTO UsuarioConfiguracion = UsuarioConfiguracionDAO.Obtener(CodUsuario);
                if (string.IsNullOrWhiteSpace(UsuarioConfiguracion.CodUsuario))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapUsuarioConfiguracion(UsuarioConfiguracion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] UsuarioConfiguracionDTO Obj)
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

                if (!PrepararUsuario(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                if (!ValidarCamposRequeridos(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                UsuarioConfiguracionDTO existente = UsuarioConfiguracionDAO.Obtener(Obj.CodUsuario);
                if (!string.IsNullOrWhiteSpace(existente.CodUsuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado));
                }

                MsjDB MsjDB = UsuarioConfiguracionDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] UsuarioConfiguracionDTO Obj)
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

                if (!PrepararUsuario(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                if (!ValidarCamposRequeridos(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                MsjDB MsjDB = UsuarioConfiguracionDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] UsuarioConfiguracionDTO Obj)
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

                if (!PrepararUsuario(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                if (!ValidarCamposRequeridos(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                MsjDB MsjDB = UsuarioConfiguracionDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Log)]
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

                if (string.IsNullOrWhiteSpace(idusuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                string CodUsuario = DesencriptarParametro(idusuario);
                if (string.IsNullOrWhiteSpace(CodUsuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var lst = UsuarioConfiguracionDAO.Log(CodUsuario);
                return Ok(lst.Select(MapUsuarioConfiguracion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string DesencriptarParametro(string parametro)
        {
            try
            {
                return Encriptacion.Desencriptar(parametro);
            }
            catch
            {
                return string.Empty;
            }
        }

        private bool PrepararUsuario(UsuarioConfiguracionDTO Obj)
        {
            string CodUsuario = DesencriptarParametro(Obj.IdUsuario);
            if (string.IsNullOrWhiteSpace(CodUsuario))
            {
                return false;
            }

            Obj.CodUsuario = CodUsuario;
            return true;
        }

        private bool ValidarCamposRequeridos(UsuarioConfiguracionDTO Obj)
        {
            return Obj.CodTipoUsuario > 0 && Obj.CodRol > 0;
        }

        private object MapUsuarioConfiguracion(UsuarioConfiguracionDTO Obj)
        {
            return new
            {
                idUsuario = Obj.IdUsuario,
                codUsuario = Obj.CodUsuario,
                tipoUsuario = Obj.TipoUsuario?.Descripcion,
                codTipoUsuario = Obj.CodTipoUsuario,
                rol = Obj.Rol?.Descripcion,
                codRol = Obj.CodRol,
                version = Obj.Version,
                codUsuarioCreacion = Obj.CodUsuarioCreacion,
                idUsuarioCreacion = Obj.IdUsuarioCreacion,
                fechaCreacion = Obj.FechaCreacion,
                codUsuarioActualizacion = Obj.CodUsuarioActualizacion,
                idUsuarioActualizacion = Obj.IdUsuarioActualizacion,
                fechaActualizacion = Obj.FechaActualizacion
            };
        }
    }
}


