using app.Messages;
using app.Models.Ventas;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentaController : ControllerBase
    {
        private readonly VentaDAO dao = new VentaDAO();
        private readonly Encriptacion encriptacion = new Encriptacion();
        private readonly VerificarUsuario verificar = new VerificarUsuario();
        [AuditoriaSistema, RequierePermiso(Menus.Venta, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            var s = verificar.ObtenerSesion();
            if (!s.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(s.Idioma));
            return Ok(dao.Listado(verificar.SesionUsuario(), page, pageSize, search, sort));
        }
        [AuditoriaSistema, RequierePermiso(Menus.Venta, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idventa) { var s = verificar.ObtenerSesion(); if (!s.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(s.Idioma)); int id = int.TryParse(encriptacion.Desencriptar(idventa), out int x) ? x : 0; var venta = dao.Obtener(id, verificar.SesionUsuario()); return venta.CodVenta == 0 ? NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado)) : Ok(venta); }
        [AuditoriaSistema, RequierePermiso(Menus.Venta, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] VentaDTO venta) { var s = verificar.ObtenerSesion(); if (!s.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(s.Idioma)); return Ok(dao.Agregar(venta, verificar.SesionUsuario())); }
    }
}
