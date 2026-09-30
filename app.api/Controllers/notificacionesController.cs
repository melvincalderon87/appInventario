using app.Messages;
using app.Models.Notificacion;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class notificacionesController : ControllerBase
    {
        private readonly NotificacionDAO NotificacionDAO = new NotificacionDAO();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Listar)]
        [HttpGet("{optional?}")]
        public IActionResult Get(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] int codTarea = 0)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Listar);
            if (acceso != null) return acceso;

            var pagina = NotificacionDAO.Listado(page, pageSize, search, sort, codTarea);
            return Ok(pagina.Map(MapNotificacion));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Visualizar)]
        [HttpGet("{id:int}")]
        public IActionResult GetById([FromRoute] int id)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Visualizar);
            if (acceso != null) return acceso;

            NotificacionDTO notificacion = NotificacionDAO.Obtener(id);
            if (notificacion.CodNotificacion <= 0)
                return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

            return Ok(MapNotificacion(notificacion));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Agregar)]
        [HttpPost("{optional?}")]
        public IActionResult Post([FromBody] NotificacionDTO Obj)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Agregar);
            if (acceso != null) return acceso;

            MsjDB msj = NotificacionDAO.Agregar(Obj);
            return msj.Estatus ? Ok(msj) : BadRequest(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Editar)]
        [HttpPut("{id:int}")]
        public IActionResult Put([FromRoute] int id, [FromBody] NotificacionDTO Obj)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Editar);
            if (acceso != null) return acceso;

            Obj.CodNotificacion = id;
            MsjDB msj = NotificacionDAO.Editar(Obj);
            return msj.Estatus ? Ok(msj) : BadRequest(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Eliminar)]
        [HttpDelete("{id:int}")]
        public IActionResult Delete([FromRoute] int id)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Eliminar);
            if (acceso != null) return acceso;

            MsjDB msj = NotificacionDAO.Eliminar(id);
            return msj.Estatus ? Ok(msj) : BadRequest(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Otro)]
        [HttpPost("{id:int}/programar")]
        public IActionResult Programar([FromRoute] int id, [FromBody] NotificacionProgramarDTO Obj)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Otro);
            if (acceso != null) return acceso;

            MsjDB msj = NotificacionDAO.Programar(id, Obj.FechaProgramada);
            if (!msj.Estatus) return BadRequest(msj);

            return Ok(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Otro)]
        [HttpPost("{id:int}/enviar-ahora")]
        public IActionResult EnviarAhora([FromRoute] int id)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Otro);
            if (acceso != null) return acceso;

            MsjDB msj = NotificacionDAO.EnviarAhora(id);
            if (!msj.Estatus) return BadRequest(msj);

            return Ok(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Otro)]
        [HttpPost("{id:int}/reintentar")]
        public IActionResult Reintentar([FromRoute] int id)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Otro);
            if (acceso != null) return acceso;

            MsjDB msj = NotificacionDAO.Reintentar(id);
            if (!msj.Estatus) return BadRequest(msj);

            return Ok(msj);
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Notificacion, Permisos.Otro)]
        [HttpPost("{id:int}/cancelar")]
        public IActionResult Cancelar([FromRoute] int id)
        {
            IActionResult? acceso = ValidarAcceso(Permisos.Otro);
            if (acceso != null) return acceso;

            MsjDB msj = NotificacionDAO.Cancelar(id);
            return msj.Estatus ? Ok(msj) : BadRequest(msj);
        }

        private IActionResult? ValidarAcceso(Permisos permiso)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado)
                return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

            if (!Accesos.Verificar(Menus.Notificacion, permiso))
                return StatusCode(403, ManejadorErrores.Crear(TipoError.SinPermiso));

            return null;
        }

        private object MapNotificacion(NotificacionDTO notificacion)
        {
            return new
            {
                notificacion.IdNotificacion,
                notificacion.CodNotificacion,
                notificacion.CodTarea,
                notificacion.IdTarea,
                notificacion.TareaDescripcion,
                notificacion.Descripcion,
                notificacion.Asunto,
                notificacion.Para,
                notificacion.Copia,
                notificacion.Texto,
                notificacion.FechaProgramada,
                notificacion.Estado,
                notificacion.EstadoDescripcion,
                notificacion.Intentos,
                notificacion.Error,
                notificacion.FechaEnviado,
                notificacion.FechaCreacion,
                notificacion.Estatus,
                notificacion.AdjuntoCantidad,
                Adjuntos = notificacion.Adjuntos.Select(adjunto => new
                {
                    adjunto.CodNotificacionAdjunto,
                    adjunto.CodNotificacion,
                    adjunto.NombreArchivo,
                    adjunto.TipoContenido,
                    adjunto.TamanoBytes,
                    adjunto.ContenidoBase64
                })
            };
        }
    }
}
