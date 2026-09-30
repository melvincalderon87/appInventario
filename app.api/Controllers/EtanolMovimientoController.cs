using app.Messages;
using app.Models.Etanol;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EtanolMovimientoController : ControllerBase
{
    private readonly EtanolMovimientoDAO dao = new();
    private readonly VerificarUsuario verificarUsuario = new();

    [AuditoriaSistema]
    [HttpGet("Listar")]
    public IActionResult Listar([FromQuery] string tipo, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
    {
        if (!Preparar(tipo, Permisos.Listar, out var d, out var error)) return error!;
        return Ok(dao.Listado(d!, page, pageSize, search, sort));
    }

    [AuditoriaSistema]
    [HttpGet("ObtenerKey")]
    public IActionResult ObtenerKey([FromQuery] string tipo)
    {
        if (!Preparar(tipo, Permisos.Agregar, out var d, out var error)) return error!;
        return Ok(new { codigo = dao.ObtenerKey(d!) });
    }

    [AuditoriaSistema]
    [HttpGet("Obtener")]
    public IActionResult Obtener([FromQuery] string tipo, [FromQuery] int codigo)
    {
        if (!Preparar(tipo, Permisos.Editar, out var d, out var error)) return error!;
        EtanolMovimientoDTO? movimiento = dao.Obtener(d!, codigo);
        return movimiento is null ? NotFound() : Ok(movimiento);
    }

    [AuditoriaSistema]
    [HttpGet("ListarProductoOpcion")]
    public IActionResult ListarProductoOpcion([FromQuery] string tipo)
    {
        if (!Preparar(tipo, Permisos.Agregar, out _, out var error)) return error!;
        return Ok(dao.ListarProductosEtanol().Select(item => new { item.Value, item.Text }));
    }

    [AuditoriaSistema]
    [HttpPost("Agregar")]
    public IActionResult Agregar([FromQuery] string tipo, [FromBody] EtanolMovimientoDTO movimiento)
    {
        if (!Preparar(tipo, Permisos.Agregar, out var d, out var error)) return error!;
        MsjDB respuesta = dao.Agregar(d!, movimiento);
        return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta);
    }

    [AuditoriaSistema]
    [HttpPost("Editar")]
    public IActionResult Editar([FromQuery] string tipo, [FromBody] EtanolMovimientoDTO movimiento)
    {
        if (!Preparar(tipo, Permisos.Editar, out var d, out var error)) return error!;
        MsjDB respuesta = dao.Editar(d!, movimiento);
        return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta);
    }

    [AuditoriaSistema]
    [HttpPost("Eliminar")]
    public IActionResult Eliminar([FromQuery] string tipo, [FromBody] EtanolMovimientoDTO movimiento)
    {
        if (!Preparar(tipo, Permisos.Eliminar, out var d, out var error)) return error!;
        MsjDB respuesta = dao.Eliminar(d!, movimiento.Codigo);
        return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta);
    }

    private bool Preparar(string tipo, Permisos permiso, out EtanolMovimientoDAO.Definicion? definicion, out IActionResult? error)
    {
        definicion = null;
        error = null;
        var sesion = verificarUsuario.ObtenerSesion();
        if (!sesion.Autenticado)
        {
            error = Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return false;
        }
        if (!dao.TryObtenerDefinicion(tipo, out var encontrada))
        {
            error = BadRequest(ManejadorErrores.Validacion("Tipo de movimiento de etanol no válido."));
            return false;
        }
        if (!Accesos.Verificar(encontrada.Menu, permiso))
        {
            error = StatusCode(403, ManejadorErrores.SinPermiso(sesion.Idioma));
            return false;
        }
        definicion = encontrada;
        return true;
    }
}
