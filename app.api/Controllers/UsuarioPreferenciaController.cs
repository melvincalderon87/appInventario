using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.UsuarioPreferencias;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioPreferenciaController : ControllerBase
    {
        private readonly UsuarioPreferenciaDAO UsuarioPreferenciaDAO = new UsuarioPreferenciaDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioPreferencia, Permisos.Listar)]
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

                var pagina = UsuarioPreferenciaDAO.Listado(CodUsuario, page, pageSize, search, sort);
                return Ok(pagina.Map(MapUsuarioPreferencia));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioPreferencia, Permisos.Visualizar)]
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

                UsuarioPreferenciaDTO UsuarioPreferencia = UsuarioPreferenciaDAO.Obtener(CodUsuario);
                if (string.IsNullOrWhiteSpace(UsuarioPreferencia.CodUsuario))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapUsuarioPreferencia(UsuarioPreferencia));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarIdioma")]
        public IActionResult ListarIdioma()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = UsuarioPreferenciaDAO.ListarIdioma();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioPreferencia, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] UsuarioPreferenciaDTO Obj)
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

                if (string.IsNullOrWhiteSpace(Obj.Idioma))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                UsuarioPreferenciaDTO existente = UsuarioPreferenciaDAO.Obtener(Obj.CodUsuario);
                if (!string.IsNullOrWhiteSpace(existente.CodUsuario))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado));
                }

                MsjDB msj = UsuarioPreferenciaDAO.Agregar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioPreferencia, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] UsuarioPreferenciaDTO Obj)
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

                if (string.IsNullOrWhiteSpace(Obj.Idioma))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                MsjDB msj = UsuarioPreferenciaDAO.Editar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioPreferencia, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] UsuarioPreferenciaDTO Obj)
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

                MsjDB msj = UsuarioPreferenciaDAO.Eliminar(Obj);
                return Ok(msj);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioPreferencia, Permisos.Log)]
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

                var lst = UsuarioPreferenciaDAO.Log(CodUsuario);
                return Ok(lst.Select(MapUsuarioPreferencia));
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

        private bool PrepararUsuario(UsuarioPreferenciaDTO Obj)
        {
            string CodUsuario = DesencriptarParametro(Obj.IdUsuario);
            if (string.IsNullOrWhiteSpace(CodUsuario))
            {
                return false;
            }

            Obj.CodUsuario = CodUsuario;
            return true;
        }

        private object MapUsuarioPreferencia(UsuarioPreferenciaDTO Obj)
        {
            return new
            {
                idUsuario = Obj.IdUsuario,
                codUsuario = Obj.CodUsuario,
                idioma = Obj.Idioma,
                theme = Obj.Theme,
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


