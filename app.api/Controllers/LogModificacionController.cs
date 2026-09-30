using app.Messages;
using app.Models.LogModificaciones;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogModificacionController : ControllerBase
    {
        private readonly LogModificacionDAO LogModificacionDAO = new LogModificacionDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.LogModificacion, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] string tabla = "",
            [FromQuery] string accion = "",
            [FromQuery] string codusuario = "",
            [FromQuery] DateTime? fechainicio = null,
            [FromQuery] DateTime? fechafin = null,
            [FromQuery] string texto = "",
            [FromQuery] string search = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string sort = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                DateTime? fechaFinFiltro = NormalizarFechaFin(fechafin);
                string textoBusqueda = string.IsNullOrWhiteSpace(search) ? texto : search;
                var pagina = LogModificacionDAO.Listado(
                    tabla,
                    accion,
                    codusuario,
                    fechainicio,
                    fechaFinFiltro,
                    textoBusqueda,
                    page,
                    pageSize,
                    sort);

                return Ok(pagina.Map(MapLogModificacion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.LogModificacion, Permisos.Listar)]
        [HttpGet("ListarModulos")]
        public IActionResult ListarModulos()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                return Ok(LogModificacionDAO.ListarModulos());
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.LogModificacion, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idlogmodificacion)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodLogModificacion = ObtenerCodLogModificacion(idlogmodificacion);
                LogModificacionDTO log = LogModificacionDAO.Obtener(CodLogModificacion);

                if (log.CodLogModificacion <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapLogModificacion(log));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private DateTime? NormalizarFechaFin(DateTime? fechaFin)
        {
            if (!fechaFin.HasValue)
                return null;

            if (fechaFin.Value.TimeOfDay == TimeSpan.Zero)
                return fechaFin.Value.Date.AddDays(1).AddSeconds(-1);

            return fechaFin;
        }

        private int ObtenerCodLogModificacion(string idlogmodificacion)
        {
            if (int.TryParse(idlogmodificacion, out int codLogModificacion))
                return codLogModificacion;

            try
            {
                string valor = Encriptacion.Desencriptar(idlogmodificacion);

                if (int.TryParse(valor, out codLogModificacion))
                    return codLogModificacion;
            }
            catch
            {
            }

            return 0;
        }

        private object MapLogModificacion(LogModificacionDTO log)
        {
            return new
            {
                log.IdLogModificacion,
                log.CodLogModificacion,
                log.Fecha,
                log.CodUsuario,
                log.Tabla,
                log.Accion,
                log.Llave,
                log.Descripcion
            };
        }
    }
}


