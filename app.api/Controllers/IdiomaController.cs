using app.Messages;
using app.Models.Idioma;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IdiomaController : ControllerBase
    {
        private readonly IdiomaDAO IdiomaDAO = new IdiomaDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Idioma, Permisos.Listar)]
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

                var pagina = IdiomaDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapIdioma));
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

                var lst = IdiomaDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Idioma, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string ididioma)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (string.IsNullOrWhiteSpace(ididioma))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                string Idioma = ObtenerIdioma(ididioma);
                if (string.IsNullOrWhiteSpace(Idioma))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                IdiomaDTO idioma = IdiomaDAO.Obtener(Idioma);
                if (string.IsNullOrWhiteSpace(idioma.Idioma))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapIdioma(idioma));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Idioma, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] IdiomaDTO Obj)
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

                if (string.IsNullOrWhiteSpace(Obj.Idioma) || string.IsNullOrWhiteSpace(Obj.Descripcion))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                if (IdiomaDAO.VerificarIdioma(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado));
                }

                MsjDB MsjDB = IdiomaDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Idioma, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] IdiomaDTO Obj)
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

                if (!PrepararIdioma(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                if (string.IsNullOrWhiteSpace(Obj.Idioma) || string.IsNullOrWhiteSpace(Obj.Descripcion))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));
                }

                MsjDB MsjDB = IdiomaDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Idioma, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] IdiomaDTO Obj)
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

                if (!PrepararIdioma(Obj))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                MsjDB MsjDB = IdiomaDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Idioma, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string ididioma)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (string.IsNullOrWhiteSpace(ididioma))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorRequerido));
                }

                string Idioma = ObtenerIdioma(ididioma);
                if (string.IsNullOrWhiteSpace(Idioma))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var lst = IdiomaDAO.Log(Idioma);
                return Ok(lst.Select(MapIdioma));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string ObtenerIdioma(string ididioma)
        {
            try
            {
                return Encriptacion.Desencriptar(ididioma);
            }
            catch
            {
                return string.Empty;
            }
        }

        private bool PrepararIdioma(IdiomaDTO Obj)
        {
            if (string.IsNullOrWhiteSpace(Obj?.IdIdioma))
            {
                return Obj != null && !string.IsNullOrWhiteSpace(Obj?.Idioma);
            }

            try
            {
                string Idioma = Encriptacion.Desencriptar(Obj.IdIdioma);
                if (!string.IsNullOrWhiteSpace(Idioma))
                {
                    Obj.Idioma = Idioma;
                    return true;
                }
            }
            catch
            {
            }

            return Obj != null && !string.IsNullOrWhiteSpace(Obj?.Idioma);
        }

        private object MapIdioma(IdiomaDTO Idioma)
        {
            return new
            {
                idIdioma = Idioma.IdIdioma,
                idioma = Idioma.Idioma,
                descripcion = Idioma.Descripcion,
                version = Idioma.Version,
                codUsuarioCreacion = Idioma.CodUsuarioCreacion,
                idUsuarioCreacion = Idioma.IdUsuarioCreacion,
                fechaCreacion = Idioma.FechaCreacion,
                codUsuarioActualizacion = Idioma.CodUsuarioActualizacion,
                idUsuarioActualizacion = Idioma.IdUsuarioActualizacion,
                fechaActualizacion = Idioma.FechaActualizacion,
            };
        }
    }
}


