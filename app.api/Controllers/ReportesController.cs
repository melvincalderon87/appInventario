using app.Messages;
using app.Models.Reportes;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly ReporteCargaDAO dao = new();

        [HttpGet("carga-ambiente")]
        [RequierePermiso(Menus.ReporteCarga, Permisos.Reporte)]
        public Task<IActionResult> CargaAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal, CancellationToken cancellationToken) => ListarCargaAmbienteAsync(fechaInicial, fechaFinal, cancellationToken);

        [HttpGet("carga-estandar")]
        [RequierePermiso(Menus.ReporteCarga, Permisos.Reporte)]
        public Task<IActionResult> CargaEstandar([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal, CancellationToken cancellationToken) => ListarCargaEstandarAsync(fechaInicial, fechaFinal, cancellationToken);

        [HttpGet("ingresos-barco")]
        [RequierePermiso(Menus.ReporteIngresosBarcos, Permisos.Reporte)]
        public async Task<IActionResult> IngresosBarco([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal, [FromQuery] string tipo = "ambiente", CancellationToken cancellationToken = default)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            var registros = await dao.ListarIngresosBarcoAsync(fechaInicial.Value.Date, fechaFinal.Value.Date, !string.Equals(tipo, "estandar", StringComparison.OrdinalIgnoreCase), cancellationToken);
            return registros.Count == 0 ? SinRegistros() : Ok(registros);
        }

        private async Task<IActionResult> ListarCargaEstandarAsync(DateTime? fechaInicial, DateTime? fechaFinal, CancellationToken cancellationToken)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            var registros = await dao.ListarCargaEstandarAsync(fechaInicial.Value.Date, fechaFinal.Value.Date, cancellationToken);
            return registros.Count == 0 ? SinRegistros() : Ok(registros);
        }

        private async Task<IActionResult> ListarCargaAmbienteAsync(DateTime? fechaInicial, DateTime? fechaFinal, CancellationToken cancellationToken)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            var registros = await dao.ListarCargaAmbienteAsync(fechaInicial.Value.Date, fechaFinal.Value.Date, cancellationToken);
            return registros.Count == 0 ? SinRegistros() : Ok(registros);
        }

        private IActionResult SinRegistros()
        {
            return NotFound(ManejadorErrores.Crear(
                TipoError.RegistroNoEncontrado,
                detalle: "No existen registros para el rango de fechas y tipo seleccionados."));
        }
    }
}
