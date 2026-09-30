using app.Messages;
using app.Models.SaldoInicial;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController, Route("api/[controller]")]
    public class SaldoInicialController : ControllerBase
    {
        private readonly SaldoInicialDAO dao = new();
        private readonly VerificarUsuario verificar = new();
        [HttpGet("Listar")]
        public IActionResult Listar([FromQuery] string tipo, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "") { IActionResult? error = ValidarAcceso(tipo, Permisos.Listar); return error ?? Ok(dao.Listado(tipo, page, pageSize, search, sort)); }
        [HttpGet("SuplidoresCombustible")]
        public IActionResult SuplidoresCombustible() { IActionResult? error = ValidarAcceso("COMBUSTIBLE", Permisos.Listar); return error ?? Ok(dao.ListarSuplidores().Select(x => new { x.Value, x.Text })); }
        [HttpGet("ProductosCombustible")]
        public IActionResult ProductosCombustible() { IActionResult? error = ValidarAcceso("COMBUSTIBLE", Permisos.Listar); return error ?? Ok(dao.ListarProductos("Combustible").Select(x => new { x.Value, x.Text })); }
        [HttpGet("Productos")]
        public IActionResult Productos([FromQuery] string tipo) { IActionResult? error = ValidarAcceso(tipo, Permisos.Listar); return error ?? Ok(dao.ListarProductos(tipo).Select(x => new { x.Value, x.Text })); }
        [HttpGet("SiguienteCorrelativo")]
        public IActionResult SiguienteCorrelativo([FromQuery] string tipo) { IActionResult? error = ValidarAcceso(tipo, Permisos.Agregar); return error ?? Ok(new { correlativo = dao.SiguienteCorrelativo() }); }
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idSaldoInicial, [FromQuery] string tipo)
        {
            IActionResult? error = ValidarAcceso(tipo, Permisos.Visualizar);
            if (error != null) return error;
            int codSaldoInicial = int.TryParse(new Encriptacion().Desencriptar(idSaldoInicial), out int value) ? value : 0;
            var saldoInicial = dao.Obtener(codSaldoInicial);
            return saldoInicial.CodSaldoInicial > 0 && saldoInicial.Tipo.Equals(tipo, StringComparison.OrdinalIgnoreCase) ? Ok(saldoInicial) : NotFound();
        }
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] SaldoInicialDTO obj) { IActionResult? error = ValidarAcceso(obj.Tipo, Permisos.Agregar); return error ?? Ok(dao.Agregar(obj)); }
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] SaldoInicialDTO obj) { IActionResult? error = ValidarAcceso(obj.Tipo, Permisos.Editar); return error ?? Ok(dao.Editar(obj)); }
        private IActionResult? ValidarAcceso(string tipo, Permisos permiso)
        {
            var sesion = verificar.ObtenerSesion();
            if (!sesion.Autenticado)
                return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

            return Accesos.Verificar(MenuPorTipo(tipo), permiso)
                ? null
                : StatusCode(StatusCodes.Status403Forbidden, ManejadorErrores.SinPermiso(sesion.Idioma));
        }
        private static Menus MenuPorTipo(string? tipo) => (tipo ?? "").Trim().ToUpperInvariant() switch
        {
            "COMBUSTIBLE" => Menus.SaldoInicialCombustible,
            "ADITIVO" => Menus.SaldoInicialAditivo,
            "COLORANTE" => Menus.SaldoInicialColorante,
            _ => Menus.NoSeleccionado
        };
    }
}
