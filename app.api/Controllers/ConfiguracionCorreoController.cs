using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.ConfiguracionCorreo;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfiguracionCorreoController : ControllerBase
    {
        private readonly ConfiguracionCorreoDAO ConfiguracionCorreoDAO = new ConfiguracionCorreoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionCorreo, Permisos.Listar)]
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

                var pagina = ConfiguracionCorreoDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapConfiguracionCorreo));
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

                var lst = ConfiguracionCorreoDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionCorreo, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idconfiguracioncorreo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodConfiguracionCorreo = ObtenerCodConfiguracionCorreo(idconfiguracioncorreo);
                ConfiguracionCorreoDTO ConfiguracionCorreo = ConfiguracionCorreoDAO.Obtener(CodConfiguracionCorreo);

                if (ConfiguracionCorreo.CodConfiguracionCorreo <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapConfiguracionCorreo(ConfiguracionCorreo));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionCorreo, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] ConfiguracionCorreoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = ConfiguracionCorreoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionCorreo, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] ConfiguracionCorreoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = ConfiguracionCorreoDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionCorreo, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] ConfiguracionCorreoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = ConfiguracionCorreoDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionCorreo, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idconfiguracioncorreo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodConfiguracionCorreo = ObtenerCodConfiguracionCorreo(idconfiguracioncorreo);
                List<ConfiguracionCorreoDTO> lst = ConfiguracionCorreoDAO.Log(CodConfiguracionCorreo);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodConfiguracionCorreo(string idconfiguracioncorreo)
        {
            string CodConfiguracionCorreo = Encriptacion.Desencriptar(idconfiguracioncorreo);
            return int.TryParse(CodConfiguracionCorreo, out int valor) ? valor : 0;
        }

        private object MapConfiguracionCorreo(ConfiguracionCorreoDTO configuracionCorreo)
        {
            return new
            {
                configuracionCorreo.IdConfiguracionCorreo,
                configuracionCorreo.CodConfiguracionCorreo,
                configuracionCorreo.Descripcion,
                configuracionCorreo.DireccionCorreo,
                configuracionCorreo.NombreUsuario,
                configuracionCorreo.Password,
                configuracionCorreo.ProveedorAutenticacion,
                configuracionCorreo.TipoAutenticacion,
                configuracionCorreo.ServidorSalida,
                configuracionCorreo.PuertoSalida,
                configuracionCorreo.SSLSalida,
                configuracionCorreo.TenantId,
                configuracionCorreo.ClientId,
                configuracionCorreo.ClientSecret,
                configuracionCorreo.RedirectUri,
                configuracionCorreo.AuthorizationUrl,
                configuracionCorreo.TokenUrl,
                configuracionCorreo.Scope,
                configuracionCorreo.RefreshToken,
                configuracionCorreo.AccessToken,
                configuracionCorreo.FechaExpiracionToken,
                configuracionCorreo.FechaUltimaAutenticacion,
                configuracionCorreo.EstatusAutenticacion,
                configuracionCorreo.UltimoErrorAutenticacion,
                configuracionCorreo.Estatus
            };
        }
    }
}


