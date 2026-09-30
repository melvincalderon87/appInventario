using app.Messages;
using app.Models.Auditorias;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly AuditoriaDAO AuditoriaDAO = new AuditoriaDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Auditoria, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] string controlador = "",
            [FromQuery] string accion = "",
            [FromQuery] string codusuario = "",
            [FromQuery] string metodo = "",
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
                var pagina = AuditoriaDAO.Listado(
                    controlador,
                    accion,
                    codusuario,
                    metodo,
                    fechainicio,
                    fechaFinFiltro,
                    textoBusqueda,
                    page,
                    pageSize,
                    sort);

                return Ok(pagina.Map(MapAuditoria));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Auditoria, Permisos.Listar)]
        [HttpGet("ListarControladores")]
        public IActionResult ListarControladores()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                return Ok(AuditoriaDAO.ListarControladores());
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Auditoria, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idauditoria)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodAuditoria = ObtenerCodAuditoria(idauditoria);
                AuditoriaDTO auditoria = AuditoriaDAO.Obtener(CodAuditoria);

                if (auditoria.CodAuditoria <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapAuditoria(auditoria));
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

        private int ObtenerCodAuditoria(string idauditoria)
        {
            if (int.TryParse(idauditoria, out int codAuditoria))
                return codAuditoria;

            try
            {
                string valor = Encriptacion.Desencriptar(idauditoria);

                if (int.TryParse(valor, out codAuditoria))
                    return codAuditoria;
            }
            catch
            {
            }

            return 0;
        }

        private object MapAuditoria(AuditoriaDTO auditoria)
        {
            return new
            {
                auditoria.IdAuditoria,
                auditoria.CodAuditoria,
                auditoria.CodUsuario,
                auditoria.SesionID,
                auditoria.IpAddress,
                auditoria.PaginaAccedida,
                auditoria.Conectado,
                auditoria.Desconectado,
                auditoria.EstadoSesion,
                auditoria.Controlador,
                auditoria.Accion,
                auditoria.Url,
                auditoria.Metodo
            };
        }
    }
}


