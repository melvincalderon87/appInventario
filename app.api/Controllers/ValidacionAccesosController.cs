using app.Messages;
using app.Models.MenuRuta;
using app.Models.Permiso;
using app.Models.UsuarioConfiguraciones;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ValidacionAccesosController : ControllerBase
    {
        private PermisoDAO PermisoDAO = new PermisoDAO();
        private MenuRutaDAO MenuRutaDAO = new MenuRutaDAO();
        private Encriptacion Encriptacion = new Encriptacion();

        [AuditoriaSistema]
        [HttpGet("ValidarPantalla")]
        public IActionResult ValidarPantalla([FromQuery] string ruta)
        {
            try
            {
                var sesion = ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (!TryObtenerRutaProtegida(ruta, out var acceso))
                {
                    return Ok(new { ok = false, tienePermiso = false, permisos = new { } });
                }

                int CodRol = ObtenerCodRol(sesion.CodUsuario);
                bool TienePermiso = PermisoDAO.Verificar(CodRol, acceso.Menu, acceso.PermisoEntrada);
                PermisoListadoDTO PermisosPantalla = PermisoDAO.ObtenerListadoPantalla(CodRol, acceso.Menu);

                return Ok(new
                {
                    ok = TienePermiso,
                    tienePermiso = TienePermiso,
                    ruta = Rutas.Normalizar(ruta),
                    codMenu = (int)acceso.Menu,
                    menu = acceso.Menu.ToString(),
                    codTipoPermiso = (int)acceso.PermisoEntrada,
                    permisoEntrada = acceso.PermisoEntrada.ToString(),
                    permisos = PermisosPantalla
                });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ValidarPermiso")]
        public IActionResult ValidarPermiso([FromQuery] string ruta, [FromQuery] Permisos codpermiso)
        {
            try
            {
                var sesion = ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (!TryObtenerRutaProtegida(ruta, out var acceso))
                {
                    return Ok(new { ok = false, tienePermiso = false });
                }

                int CodRol = ObtenerCodRol(sesion.CodUsuario);
                bool TienePermiso = PermisoDAO.Verificar(CodRol, acceso.Menu, codpermiso);
                return Ok(new { ok = TienePermiso, tienePermiso = TienePermiso });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ObtenerRuta")]
        public IActionResult ObtenerRuta([FromQuery] string ruta)
        {
            try
            {
                var sesion = ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (!TryObtenerRutaProtegida(ruta, out var acceso))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RutaNoConfigurada));
                }

                return Ok(new
                {
                    ok = true,
                    ruta = Rutas.Normalizar(ruta),
                    codMenu = (int)acceso.Menu,
                    menu = acceso.Menu.ToString(),
                    codTipoPermiso = (int)acceso.PermisoEntrada,
                    permisoEntrada = acceso.PermisoEntrada.ToString()
                });
            }
            catch (Exception)
            {
                throw;
            }
        }

        private (bool Autenticado, string Idioma, string CodUsuario) ObtenerSesion()
        {
            string Idioma = Sesion.Obtener.Session.GetString("Idioma") ?? "es-GT";
            string? CodUsuarioSesion = Sesion.Obtener.Session.GetString("CodUsuario");

            if (CodUsuarioSesion == null)
            {
                return (false, Idioma, "");
            }

            string CodUsuario = Encriptacion.Desencriptar(CodUsuarioSesion);

            if (CodUsuario == null)
            {
                return (false, Idioma, "");
            }

            return (true, Idioma, CodUsuario);
        }

        private int ObtenerCodRol(string CodUsuario)
        {
            UsuarioConfiguracionDAO UsuarioConfiguracionDAO = new UsuarioConfiguracionDAO();
            UsuarioConfiguracionDTO UsuarioConfiguracion = UsuarioConfiguracionDAO.Obtener(CodUsuario);
            return UsuarioConfiguracion.CodRol;
        }

        private bool TryObtenerRutaProtegida(string ruta, out (Menus Menu, Permisos PermisoEntrada) acceso)
        {
            return MenuRutaDAO.TryObtener(ruta, out acceso);
        }
    }
}


