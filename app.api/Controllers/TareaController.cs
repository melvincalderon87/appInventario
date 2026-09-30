using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Tarea;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TareaController : ControllerBase
    {
        private readonly TareaDAO TareaDAO = new TareaDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Listar)]
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
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                var pagina = TareaDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapTarea));
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
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                var lst = TareaDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idtarea)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                int CodTarea = ObtenerCodTarea(idtarea);
                TareaDTO Tarea = TareaDAO.Obtener(CodTarea);

                if (Tarea.CodTarea <= 0)
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

                return Ok(MapTarea(Tarea));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] TareaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = TareaDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] TareaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = TareaDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] TareaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                MsjDB MsjDB = TareaDAO.Eliminar(Obj.CodTarea);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idtarea)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                int CodTarea = ObtenerCodTarea(idtarea);
                List<TareaDTO> lst = TareaDAO.Log(CodTarea);
                return Ok(lst.Select(MapTareaLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodTarea(string idtarea)
        {
            if (int.TryParse(idtarea, out int valorDirecto))
                return valorDirecto;

            string CodTarea = Encriptacion.Desencriptar(idtarea);
            return int.TryParse(CodTarea, out int valor) ? valor : 0;
        }

        private string? ValidarCamposRequeridos(TareaDTO Obj)
        {
            if (string.IsNullOrWhiteSpace(Obj.Descripcion))
                return "La descripcion de la tarea es requerida.";

            return null;
        }

        private object MapTarea(TareaDTO tarea)
        {
            return new
            {
                tarea.IdTarea,
                tarea.CodTarea,
                tarea.Descripcion,
                tarea.Tiempo,
                tarea.Estatus,
                tarea.NotificacionCantidad
            };
        }

        private object MapTareaLog(TareaDTO tarea)
        {
            return new
            {
                tarea.IdTarea,
                tarea.CodTarea,
                tarea.Descripcion,
                tarea.Tiempo,
                tarea.Estatus,
                tarea.NotificacionCantidad,
                tarea.Version,
                tarea.CodUsuarioCreacion,
                tarea.IdUsuarioCreacion,
                tarea.FechaCreacion,
                tarea.CodUsuarioActualizacion,
                tarea.IdUsuarioActualizacion,
                tarea.FechaActualizacion
            };
        }
    }
}


