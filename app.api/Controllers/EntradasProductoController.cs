using app.Messages;
using app.Models.EntradasProducto;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntradasProductoController : ControllerBase
    {
        private readonly EntradasProductoDAO EntradasProductoDAO = new EntradasProductoDAO();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.EntradasProducto, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                return Ok(EntradasProductoDAO.Listado(page, pageSize, search, sort).Map(entrada => new
                {
                    entrada.IdEntradaProducto,
                    entrada.CodEntradaProducto,
                    entrada.Fecha,
                    entrada.CodSuplidor,
                    entrada.IdSuplidor,
                    entrada.Suplidor,
                    entrada.CodProducto,
                    entrada.IdProducto,
                    entrada.Producto,
                    entrada.SiglasUnidad,
                    entrada.CantidadEstandar,
                    entrada.CantidadAmbiente
                }));
            }
            catch { return StatusCode(500, ManejadorErrores.Crear(TipoError.ServidorInterno)); }
        }

        [AuditoriaSistema, RequierePermiso(Menus.AjusteEntradaProducto, Permisos.Listar)]
        [HttpGet("AjusteListar")]
        public IActionResult AjusteListar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return Ok(EntradasProductoDAO.ListadoAjustes(page, pageSize, search, sort).Map(entrada => new { codigo = entrada.CodEntradaProducto, entrada.Fecha, entrada.Suplidor, entrada.Producto, entrada.SiglasUnidad, entrada.CantidadEstandar, entrada.CantidadAmbiente }));
        }

        [AuditoriaSistema, RequierePermiso(Menus.EntradaUnidad, Permisos.Listar)]
        [HttpGet("UnidadListar")]
        public IActionResult UnidadListar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return Ok(EntradasProductoDAO.ListadoUnidad(page, pageSize, search, sort).Map(entrada => new { codigo = entrada.CodEntradaProducto, entrada.Fecha, entrada.Suplidor, entrada.Producto, entrada.SiglasUnidad, entrada.CantidadEstandar, entrada.CantidadAmbiente }));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.EntradasProducto, Permisos.Agregar)]
        [HttpGet("ObtenerKey")]
        public IActionResult ObtenerKey()
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return Ok(new { codEntradaProducto = EntradasProductoDAO.ObtenerKey() });
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.EntradasProducto, Permisos.Agregar)]
        [HttpGet("ListarProductoOpcion")]
        public IActionResult ListarProductoOpcion()
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return Ok(EntradasProductoDAO.ListarProductosCombustible().Select(item => new { item.Value, item.Text }));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.EntradasProducto, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] EntradasProductoDTO entrada)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            MsjDB respuesta = EntradasProductoDAO.Agregar(entrada);
            return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta);
        }

        [AuditoriaSistema, RequierePermiso(Menus.AjusteEntradaProducto, Permisos.Agregar)]
        [HttpPost("AjusteAgregar")]
        public IActionResult AjusteAgregar([FromBody] EntradasProductoDTO entrada)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            MsjDB respuesta = EntradasProductoDAO.AgregarAjuste(entrada);
            return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta);
        }

        [AuditoriaSistema, RequierePermiso(Menus.EntradaUnidad, Permisos.Agregar)]
        [HttpPost("UnidadAgregar")]
        public IActionResult UnidadAgregar([FromBody] EntradasProductoDTO entrada) { var sesion = ObjVerificarUsuario.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma)); var respuesta = EntradasProductoDAO.AgregarUnidad(entrada); return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta); }
    }
}
