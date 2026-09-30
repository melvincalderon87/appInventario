using app;
using app.Messages;
using app.Models.Menu;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private MenuDAO MenuDAO = new MenuDAO();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        /// <summary>
        /// Procedimiento para salir, borra la sesion del usuairo
        /// </summary>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpGet("ObtenerMenu")]
        public IActionResult ObtenerMenu()
        {
            try
            {
                string Idioma = Sesion.Obtener.Session.GetString("Idioma");
                string CodUsuario = ObjEncriptacion.Desencriptar(Sesion.Obtener.Session.GetString("CodUsuario"));
                if (CodUsuario == null)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(Idioma ?? "es-GT"));
                }
                else
                {
                    List<MenuDTO> lst = MenuDAO.ObtenerMenuArbol(Idioma);

                    //List<MenuDTO> lst = MenuDAO.ObtenerMenu(Idioma).ToList();
                    if (lst != null)
                    {
                        return Ok(lst);
                    }
                    else
                    {
                        if (Idioma != null)
                            return NotFound(ManejadorErrores.Crear(TipoError.Home_ObtenerMenu, Idioma));
                        else
                            return NotFound(ManejadorErrores.Crear(TipoError.Home_ObtenerMenu, "es-GT"));
                    }
                }
            }
            catch (Exception)
            {
                throw;
            }
        }
        /// <summary>
        /// Procedimiento para salir, borra la sesion del usuairo
        /// </summary>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpGet("ObtenerUsuario")]
        public IActionResult ObtenerUsuario()
        {
            try
            {
                string NombreUsuario = Sesion.Obtener.Session.GetString("NombreUsuario");
                string Idioma = Sesion.Obtener.Session.GetString("Idioma");
                if (NombreUsuario == null)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(Idioma ?? "es-GT"));
                }
                else
                {
                    return Ok(new { nombreusuario = NombreUsuario });

                }
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// Procedimiento para salir, borra la sesion del usuairo
        /// </summary>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpGet("ObtenerIdioma")]
        public IActionResult ObtenerIdioma()
        {
            try
            {
                string Idioma = Sesion.Obtener.Session.GetString("Idioma");
                if (Idioma == null)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(Idioma ?? "es-GT"));
                }
                else
                {
                    return Ok(new { idioma = Idioma });
                }
            }
            catch (Exception)
            {
                throw;
            }
        }
        /// <summary>
        /// Obtiene el tema visual configurado para el usuario en sesion.
        /// </summary>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpGet("ObtenerTheme")]
        public IActionResult ObtenerTheme()
        {
            try
            {
                string Idioma = Sesion.Obtener.Session.GetString("Idioma");
                string Theme = Sesion.Obtener.Session.GetString("Theme");

                if (Theme == null)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(Idioma ?? "es-GT"));
                }
                else
                {
                    return Ok(new { theme = Theme });
                }
            }
            catch (Exception)
            {
                throw;
            }
        }
        /// <summary>
        /// Actualiza el tema visual configurado para el usuario en sesion.
        /// </summary>
        /// <param name="codtheme"></param>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpPost("CambiarTheme")]
        public IActionResult CambiarTheme([FromQuery] string codtheme)
        {
            try
            {
                if (!SesionActiva(out IActionResult? error))
                    return error!;

                string Theme = string.IsNullOrWhiteSpace(codtheme) ? "bluedark" : codtheme.Trim().ToLower();
                Sesion.Obtener.Session.SetString("Theme", Theme);
                return Ok();
            }
            catch (Exception)
            {
                throw;
            }
        }
        /// <summary>
        /// Realiza el login del usuario
        /// </summary>
        /// <param name="Login_"></param>
        /// <returns></returns>
        [AuditoriaSistema]
        [HttpPost("CambiarIdioma")]
        public IActionResult CambiarIdioma([FromQuery] string codidioma)
        {
            try
            {
                if (!SesionActiva(out IActionResult? error))
                    return error!;

                string Idioma = Sesion.Obtener.Session.GetString("Idioma");
                Sesion.Obtener.Session.SetString(
                    "Idioma",
                    string.IsNullOrWhiteSpace(codidioma) ? "es-GT" : codidioma
                );
                return Ok();
            }
            catch (Exception)
            {
                throw;
            }
        }

        private bool SesionActiva(out IActionResult? error)
        {
            string idioma = Sesion.Obtener.Session.GetString("Idioma") ?? "es-GT";
            string? codUsuarioSesion = Sesion.Obtener.Session.GetString("CodUsuario");

            if (string.IsNullOrWhiteSpace(codUsuarioSesion))
            {
                error = Unauthorized(ManejadorErrores.NoAutorizado(idioma));
                return false;
            }

            error = null;
            return true;
        }

    }
}


