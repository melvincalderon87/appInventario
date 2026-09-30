using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.CompraVentaSuplidores;

namespace app.Controllers
{
    [ApiController]
    [Route("api/compraventasuplidores")]
    public class CompraVentaSuplidoresController : ControllerBase
    {
        private readonly CompraVentaSuplidoresDAO CompraVentaSuplidoresDAO = new CompraVentaSuplidoresDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompraVentaSuplidores, Permisos.Listar)]
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
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var pagina = CompraVentaSuplidoresDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapTraslado));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompraVentaSuplidores, Permisos.Agregar)]
        [HttpGet("ObtenerKey")]
        public IActionResult ObtenerKey()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                return Ok(new { codCompraVentaSuplidores = CompraVentaSuplidoresDAO.ObtenerKey() });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarProductoOpcion")]
        public IActionResult ListarProductoOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                return Ok(CompraVentaSuplidoresDAO.ListarProductosCombustible().Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompraVentaSuplidores, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idcompraventasuplidores)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCompraVentaSuplidores = ObtenerCodCompraVentaSuplidores(idcompraventasuplidores);
                CompraVentaSuplidoresDTO traslado = CompraVentaSuplidoresDAO.Obtener(CodCompraVentaSuplidores);

                if (traslado.CodCompraVentaSuplidores <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapTraslado(traslado));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompraVentaSuplidores, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] CompraVentaSuplidoresDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = CompraVentaSuplidoresDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompraVentaSuplidores, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] CompraVentaSuplidoresDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = CompraVentaSuplidoresDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CompraVentaSuplidores, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] CompraVentaSuplidoresDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = CompraVentaSuplidoresDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodCompraVentaSuplidores(string idcompraventasuplidores)
        {
            string CodCompraVentaSuplidores = Encriptacion.Desencriptar(idcompraventasuplidores);
            return int.TryParse(CodCompraVentaSuplidores, out int valor) ? valor : 0;
        }

        private string? ValidarCamposRequeridos(CompraVentaSuplidoresDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            if (Obj.CodSuplidorOrigen <= 0)
                return "El suplidor origen es requerido.";

            if (Obj.CodSuplidorDestino <= 0)
                return "El suplidor destino es requerido.";

            if (Obj.CodSuplidorOrigen == Obj.CodSuplidorDestino)
                return "El suplidor origen y el suplidor destino deben ser diferentes.";

            if (Obj.CodProducto <= 0)
                return "El producto es requerido.";

            if (Obj.CantidadEstandar <= 0)
                return "La cantidad estandar debe ser mayor a cero.";

            if (Obj.CantidadAmbiente <= 0)
                return "La cantidad ambiente debe ser mayor a cero.";

            return null;
        }

        private object MapTraslado(CompraVentaSuplidoresDTO traslado)
        {
            return new
            {
                traslado.IdCompraVentaSuplidores,
                traslado.CodCompraVentaSuplidores,
                traslado.Fecha,
                traslado.CodSuplidorOrigen,
                traslado.IdSuplidorOrigen,
                traslado.SuplidorOrigen,
                traslado.CodSuplidorDestino,
                traslado.IdSuplidorDestino,
                traslado.SuplidorDestino,
                traslado.CodProducto,
                traslado.IdProducto,
                traslado.Producto,
                traslado.CantidadEstandar,
                traslado.CantidadAmbiente,
                traslado.Estatus
            };
        }
    }
}
