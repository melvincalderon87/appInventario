using app.Models.LogModificaciones;
using app.Messages;
using app.Models.UsuarioConfiguraciones;
using app.Models.UsuarioPreferencias;
using app.Models.Usuarios;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private UsuarioDTO Usuario = new UsuarioDTO();
        private UsuarioDAO UsuarioDAO = new UsuarioDAO();
        private Encriptacion Encriptacion = new Encriptacion();
        private UsuarioConfiguracionDTO UsuarioConfiguracion = new UsuarioConfiguracionDTO();
        private UsuarioConfiguracionDAO UsuarioConfiguracionDAO = new UsuarioConfiguracionDAO();
        private UsuarioPreferenciaDTO UsuarioPreferencia = new UsuarioPreferenciaDTO();
        private UsuarioPreferenciaDAO UsuarioPreferenciaDAO = new UsuarioPreferenciaDAO();
        /// <summary>
        /// Realiza el login del usuario
        /// </summary>
        /// <param name="Login_"></param>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpPost("login")]
        public IActionResult Login([FromBody] Login Login_)
        {
            if (Login_ == null || string.IsNullOrWhiteSpace(Login_.CodUsuario) || string.IsNullOrWhiteSpace(Login_.Password))
            {
                return BadRequest(ManejadorErrores.Crear(TipoError.Login_General, "es-GT"));
            }

            bool Autenticado = false;
            Login_.CodUsuario = Login_.CodUsuario.ToLower();
            Usuario = UsuarioDAO.Obtener(Login_.CodUsuario);
            string Idioma = string.Empty;
            if (Usuario.CodUsuario == null)
                return Unauthorized(ManejadorErrores.Crear(TipoError.Login_Usuario, "es-GT"));

            var PasswordEncriptado = Encriptacion.EncriptarHex(Login_.Password);
            if (Usuario.Password != PasswordEncriptado)
                return Unauthorized(ManejadorErrores.Crear(TipoError.Login_Password, "es-GT"));

            Autenticado = UsuarioDAO.Autenticarse(Login_);
            if (Autenticado == true)
            {
                Sesion.Obtener.Session.SetString("CodUsuario", Encriptacion.Encriptar(Login_.CodUsuario));
                Sesion.Obtener.Session.SetString("NombreUsuario", Usuario.Nombre.ToString());
                UsuarioConfiguracion = UsuarioConfiguracionDAO.Obtener(Login_.CodUsuario);
                Sesion.Obtener.Session.SetString("CodRol", Encriptacion.Encriptar(UsuarioConfiguracion.CodRol.ToString()));
                UsuarioPreferencia = UsuarioPreferenciaDAO.Obtener(Login_.CodUsuario);
                if (UsuarioPreferencia.Idioma != null)
                { Idioma = UsuarioPreferencia.Idioma.ToString(); }
                else
                { Idioma = "es-GT"; }

                Sesion.Obtener.Session.SetString("Idioma", Idioma);
                Sesion.Obtener.Session.SetString("Theme",
                    string.IsNullOrWhiteSpace(UsuarioPreferencia.Theme) ? "bluedark" : UsuarioPreferencia.Theme);
                LogModificacionDAO.RegistrarConUsuario(
                    Login_.CodUsuario,
                    "Login",
                    "Login",
                    "CodUsuario:" + Login_.CodUsuario,
                    "Inicio de sesion");
                var respuesta = MensajeRespuesta.Ok(TipoOperacion.Login, idioma: Idioma);
                return Ok(new
                {
                    ok = true,
                    estatus = respuesta.Estatus,
                    msj = respuesta.Msj,
                    message = respuesta.Msj,
                    key = respuesta.Key,
                    codigo = respuesta.Codigo,
                    tipo = respuesta.Tipo,
                    operacion = respuesta.Operacion
                });
            }
            else
            {
                return Unauthorized(ManejadorErrores.Crear(TipoError.Login_General, "es-GT"));
            }
        }
        /// <summary>
        /// Procedimiento para salir, borra la sesion del usuairo
        /// </summary>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpPost("salir")]
        public ActionResult Salir()
        {
            var Context = HttpContext.Session;
            string Idioma = string.Empty;
            Idioma = Sesion.Obtener.Session.GetString("Idioma") ?? "es-GT";
            string? CodUsuarioSesion = Context.GetString("CodUsuario");
            string CodUsuario = string.IsNullOrWhiteSpace(CodUsuarioSesion)
                ? ""
                : Encriptacion.Desencriptar(CodUsuarioSesion);
            var expiredCookie = new CookieOptions
            {
                Expires = DateTimeOffset.UtcNow.AddDays(-1),
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/"
            };

            if (!string.IsNullOrWhiteSpace(CodUsuario))
            {
                LogModificacionDAO.RegistrarConUsuario(
                    CodUsuario,
                    "Login",
                    "Salir",
                    "CodUsuario:" + CodUsuario,
                    "Salida de sesion");
            }

            Context.Clear();
            Response.Cookies.Append(".app.session", "", expiredCookie);
            Response.Cookies.Append(".AspNetCore.Session", "", expiredCookie);

            if (string.IsNullOrEmpty(Idioma))
            {
                Idioma = "es-GT";
                return Ok(MensajeRespuesta.Ok(TipoOperacion.Salir, idioma: Idioma));
            }
            else
            {
                try
                {
                    return Ok(MensajeRespuesta.Ok(TipoOperacion.Salir, idioma: Idioma));
                }
                catch (Exception)
                {
                    return Ok(ManejadorErrores.Crear(TipoError.Login_Salir, Idioma));
                }
            }
        }
        /// <summary>
        /// Procedimiento para salir, borra la sesion del usuairo
        /// </summary>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpGet("ValidarSesion")]
        public IActionResult ValidarSesion()
        {
            try
            {
                string Idioma = Sesion.Obtener.Session.GetString("Idioma");
                string? CodUsuarioSesion = Sesion.Obtener.Session.GetString("CodUsuario");

                if (string.IsNullOrWhiteSpace(CodUsuarioSesion))
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(Idioma ?? "es-GT"));
                }

                string CodUsuario = Encriptacion.Desencriptar(CodUsuarioSesion);
                if (string.IsNullOrWhiteSpace(CodUsuario))
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(Idioma ?? "es-GT"));
                }

                return Ok(new { ok = true });
            }
            catch (Exception)
            {
                throw;
            }
        }
        [AuditoriaSistema]
        [HttpGet("validarpermiso")]
        public IActionResult ValidarPermiso([FromQuery] Menus codmenu, [FromQuery] Permisos codpermiso)
        {
            string Idioma = Sesion.Obtener.Session.GetString("Idioma") ?? "es-GT";

            if (codmenu == Menus.NoSeleccionado || codpermiso == Permisos.NoSeleccionado)
            {
                return BadRequest(ManejadorErrores.Crear(TipoError.ParametrosRequeridos, Idioma));
            }

            string? CodUsuarioSesion = Sesion.Obtener.Session.GetString("CodUsuario");

            if (string.IsNullOrWhiteSpace(CodUsuarioSesion))
            {
                return Unauthorized(ManejadorErrores.NoAutorizado(Idioma));
            }

            try
            {
                bool TienePermiso = Accesos.Verificar(codmenu, codpermiso);

                if (!TienePermiso)
                {
                    return Forbid();
                }

                return Ok(new { ok = true, tienePermiso = true });
            }
            catch (Exception)
            {
                throw;
            }
        }
    }
}


