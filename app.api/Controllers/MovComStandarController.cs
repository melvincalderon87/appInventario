using app.Messages;
using app.Models.MovComStandar;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MovComStandarController : ControllerBase
    {
        private readonly MovComStandarDAO dao = new();

        private IActionResult ErrorConsulta() => StatusCode(500, ManejadorErrores.Crear(TipoError.ServidorInterno));

        [HttpGet("Generar")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult Generar([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue)
                return BadRequest(new { estatus = false, msj = "Las fechas inicial y final son requeridas." });

            if (fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "La fecha inicial no puede ser mayor que la fecha final." });

            try
            {
                return Ok(dao.Generar(fechaInicial.Value.Date, fechaFinal.Value.Date));
            }
            catch
            {
                return StatusCode(500, ManejadorErrores.Crear(TipoError.ServidorInterno));
            }
        }

        [HttpGet("GenerarAmbiente")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult GenerarAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.GenerarAmbiente(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("IngresosBarco")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult IngresosBarco([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue)
                return BadRequest(new { estatus = false, msj = "Las fechas inicial y final son requeridas." });

            if (fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "La fecha inicial no puede ser mayor que la fecha final." });

            try
            {
                return Ok(dao.ListarIngresosBarco(fechaInicial.Value.Date, fechaFinal.Value.Date));
            }
            catch
            {
                // Los ingresos de barco son una sección informativa del reporte.
                // Si no pueden consultarse, se conserva el reporte y el PDF muestra
                // la tabla vacía con sus totales en cero.
                return ErrorConsulta();
            }
        }

        [HttpGet("IngresosBarcoAmbiente")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult IngresosBarcoAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });

            try { return Ok(dao.ListarIngresosBarcoAmbiente(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("MovimientosUnidad")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult MovimientosUnidad([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });

            try { return Ok(dao.ListarMovimientosUnidad(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("MovimientosUnidadAmbiente")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult MovimientosUnidadAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarMovimientosUnidadAmbiente(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("EntradasUnidadEtanol")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult EntradasUnidadEtanol([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal, [FromQuery] bool ambiente = false)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarEntradasUnidadEtanol(fechaInicial.Value.Date, fechaFinal.Value.Date, ambiente)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("CompraVentaSuplidores")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult CompraVentaSuplidores([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });

            try { return Ok(dao.ListarCompraVentaSuplidores(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("CompraVentaSuplidoresAmbiente")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult CompraVentaSuplidoresAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarCompraVentaSuplidoresAmbiente(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("Tanques")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult Tanques([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarTanques(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("Aditivos")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult Aditivos([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarAditivos(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("ConsumosBiAditivos")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult ConsumosBiAditivos([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarConsumosBiAditivos(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("ConsumosBiDiariosAditivos")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult ConsumosBiDiariosAditivos([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarConsumosBiDiariosAditivosEstandar(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("ConsumosBiDiariosAditivosAmbiente")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult ConsumosBiDiariosAditivosAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarConsumosBiDiariosAditivosAmbiente(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("ConsumosBiDiariosEtanol")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult ConsumosBiDiariosEtanol([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarConsumosBiDiariosEtanolEstandar(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("ConsumosBiDiariosEtanolAmbiente")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult ConsumosBiDiariosEtanolAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarConsumosBiDiariosEtanolAmbiente(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("ConsumosBiDiariosCombustibles")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult ConsumosBiDiariosCombustibles([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarConsumosBiDiariosCombustiblesEstandar(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }

        [HttpGet("ConsumosBiDiariosCombustiblesAmbiente")]
        [RequierePermiso(Menus.MovComStandar, Permisos.Reporte)]
        public IActionResult ConsumosBiDiariosCombustiblesAmbiente([FromQuery] DateTime? fechaInicial, [FromQuery] DateTime? fechaFinal)
        {
            if (!fechaInicial.HasValue || !fechaFinal.HasValue || fechaInicial.Value.Date > fechaFinal.Value.Date)
                return BadRequest(new { estatus = false, msj = "El rango de fechas no es válido." });
            try { return Ok(dao.ListarConsumosBiDiariosCombustiblesAmbiente(fechaInicial.Value.Date, fechaFinal.Value.Date)); }
            catch { return ErrorConsulta(); }
        }
    }
}
