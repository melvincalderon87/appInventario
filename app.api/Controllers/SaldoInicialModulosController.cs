using app.Models.SaldoInicial;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers;

public abstract class SaldoInicialModuloControllerBase : ControllerBase
{
    private readonly SaldoInicialModuloDAO dao = new(); protected abstract string Tipo { get; }
    protected abstract Menus Menu { get; }
    protected IActionResult? ValidarAcceso(Permisos permiso)
    {
        var sesion = new VerificarUsuario().ObtenerSesion();
        if (!sesion.Autenticado)
            return Unauthorized(app.Messages.ManejadorErrores.Crear(app.Messages.TipoError.Usuario_Nologin, sesion.Idioma));

        return Accesos.Verificar(Menu, permiso)
            ? null
            : StatusCode(StatusCodes.Status403Forbidden, app.Messages.ManejadorErrores.Crear(app.Messages.TipoError.SinPermiso, sesion.Idioma));
    }

    [HttpGet("Listar")] public IActionResult Listar(int page = 1, int pageSize = 50, string search = "", string sort = "") { IActionResult? error = ValidarAcceso(Permisos.Listar); return error ?? base.Ok(dao.Listado(Tipo, page, pageSize, search, sort)); }
    [HttpGet("Productos")] public IActionResult Productos() { IActionResult? error = ValidarAcceso(Permisos.Listar); return error ?? base.Ok(dao.Productos(Tipo).Select(x => new { x.Value, x.Text })); }
    [HttpGet("SiguienteCorrelativo")] public IActionResult Siguiente() { IActionResult? error = ValidarAcceso(Permisos.Agregar); return error ?? base.Ok(new { correlativo = dao.Siguiente(Tipo) }); }
    [HttpGet("Obtener")] public IActionResult Obtener(string idSaldoInicial) { IActionResult? error = ValidarAcceso(Permisos.Visualizar); if (error != null) return error; int.TryParse(new Encriptacion().Desencriptar(idSaldoInicial), out var c); return base.Ok(dao.Obtener(Tipo, c)); }
    [HttpPost("Agregar")] public IActionResult Agregar([FromBody] SaldoInicialDTO o) { IActionResult? error = ValidarAcceso(Permisos.Agregar); return error ?? base.Ok(dao.Agregar(Tipo, o)); }
    [HttpPost("Editar")] public IActionResult Editar([FromBody] SaldoInicialDTO o) { IActionResult? error = ValidarAcceso(Permisos.Editar); return error ?? base.Ok(dao.Editar(Tipo, o)); }
}
[ApiController, Route("api/SaldoInicialCombustible")] public sealed class SaldoInicialCombustibleController : SaldoInicialModuloControllerBase { protected override string Tipo => "COMBUSTIBLE"; protected override Menus Menu => Menus.SaldoInicialCombustible; [HttpGet("Suplidores")] public IActionResult Suplidores() { IActionResult? error = ValidarAcceso(Permisos.Listar); return error ?? Ok(new SaldoInicialModuloDAO().Suplidores().Select(x => new { x.Value, x.Text })); } }
[ApiController, Route("api/SaldoInicialAditivo")] public sealed class SaldoInicialAditivoController : SaldoInicialModuloControllerBase { protected override string Tipo => "ADITIVO"; protected override Menus Menu => Menus.SaldoInicialAditivo; }
[ApiController, Route("api/SaldoInicialColorante")] public sealed class SaldoInicialColoranteController : SaldoInicialModuloControllerBase { protected override string Tipo => "COLORANTE"; protected override Menus Menu => Menus.SaldoInicialColorante; }
[ApiController, Route("api/SaldoInicialEtanol")] public sealed class SaldoInicialEtanolController : SaldoInicialModuloControllerBase { protected override string Tipo => "ETANOL"; protected override Menus Menu => Menus.SaldoInicialEtanol; }
