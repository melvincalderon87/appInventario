using app.Messages;
using app.Models.Tarea;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class tareasController : ControllerBase
    {
        private readonly TareaDAO TareaDAO = new TareaDAO();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Listar)]
        [HttpGet("{optional?}")]
        public IActionResult Get(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "")
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Listar);
            if (acceso != null) return acceso;

            var pagina = TareaDAO.Listado(page, pageSize, search, sort);
            return Ok(pagina.Map(MapTarea));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Visualizar)]
        [HttpGet("{id:int}")]
        public IActionResult GetById([FromRoute] int id)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Visualizar);
            if (acceso != null) return acceso;

            TareaDTO tarea = TareaDAO.Obtener(id);
            if (tarea.CodTarea <= 0)
                return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

            return Ok(MapTarea(tarea));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Agregar)]
        [HttpPost("{optional?}")]
        public IActionResult Post([FromBody] TareaDTO Obj)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Agregar);
            if (acceso != null) return acceso;

            MsjDB msj = TareaDAO.Agregar(Obj);
            return msj.Estatus ? Ok(msj) : BadRequest(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Editar)]
        [HttpPut("{id:int}")]
        public IActionResult Put([FromRoute] int id, [FromBody] TareaDTO Obj)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Editar);
            if (acceso != null) return acceso;

            Obj.CodTarea = id;
            MsjDB msj = TareaDAO.Editar(Obj);
            return msj.Estatus ? Ok(msj) : BadRequest(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Tarea, Permisos.Eliminar)]
        [HttpDelete("{id:int}")]
        public IActionResult Delete([FromRoute] int id)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Eliminar);
            if (acceso != null) return acceso;

            MsjDB msj = TareaDAO.Eliminar(id);
            return msj.Estatus ? Ok(msj) : BadRequest(msj);
        }

        private IActionResult? ValidarAcceso(Permisos permiso)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado)
                return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

            if (!Accesos.Verificar(Menus.Tarea, permiso))
                return StatusCode(403, ManejadorErrores.Crear(TipoError.SinPermiso));

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
    }
}
