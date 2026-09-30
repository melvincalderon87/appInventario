using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Salidas;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalidasController : ControllerBase
    {
        private readonly SalidasDAO SalidasDAO = new SalidasDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Salida, Permisos.Listar)]
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

                var pagina = SalidasDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapSalida));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Salida, Permisos.Agregar)]
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

                return Ok(new { codSalida = SalidasDAO.ObtenerKey() });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema, RequierePermiso(Menus.AjusteSalidaProducto, Permisos.Listar)]
        [HttpGet("AjusteListar")]
        public IActionResult AjusteListar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return Ok(SalidasDAO.ListadoAjustes(page, pageSize, search, sort).Map(MapListadoMovimiento));
        }

        [AuditoriaSistema, RequierePermiso(Menus.SalidaUnidad, Permisos.Listar)]
        [HttpGet("UnidadListar")]
        public IActionResult UnidadListar([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string search = "", [FromQuery] string sort = "")
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            return Ok(SalidasDAO.ListadoUnidad(page, pageSize, search, sort).Map(MapListadoMovimiento));
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

                return Ok(SalidasDAO.ListarProductosCombustible().Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Salida, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idsalida)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodSalida = ObtenerCodSalida(idsalida);
                SalidasDTO salida = SalidasDAO.Obtener(CodSalida);

                if (salida.CodSalida <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapSalida(salida));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Salida, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] SalidasDTO Obj)
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

                MsjDB MsjDB = SalidasDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema, RequierePermiso(Menus.AjusteSalidaProducto, Permisos.Agregar)]
        [HttpPost("AjusteAgregar")]
        public IActionResult AjusteAgregar([FromBody] SalidasDTO Obj)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            MsjDB respuesta = SalidasDAO.AgregarAjuste(Obj);
            return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta);
        }

        [AuditoriaSistema, RequierePermiso(Menus.SalidaUnidad, Permisos.Agregar)]
        [HttpPost("UnidadAgregar")]
        public IActionResult UnidadAgregar([FromBody] SalidasDTO Obj) { var sesion = ObjVerificarUsuario.ObtenerSesion(); if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma)); var respuesta = SalidasDAO.AgregarUnidad(Obj); return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta); }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Salida, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] SalidasDTO Obj)
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

                MsjDB MsjDB = SalidasDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Salida, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] SalidasDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = SalidasDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodSalida(string idsalida)
        {
            string CodSalida = Encriptacion.Desencriptar(idsalida);
            return int.TryParse(CodSalida, out int valor) ? valor : 0;
        }

        private string? ValidarCamposRequeridos(SalidasDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            if (Obj.CodSuplidor <= 0)
                return "El suplidor es requerido.";

            if (Obj.CodProducto <= 0)
                return "El producto es requerido.";

            if (Obj.CantidadEstandar <= 0)
                return "La cantidad estandar debe ser mayor a cero.";

            if (Obj.CantidadAmbiente <= 0)
                return "La cantidad ambiente debe ser mayor a cero.";

            return null;
        }

        private object MapSalida(SalidasDTO salida)
        {
            return new
            {
                salida.IdSalida,
                salida.CodSalida,
                salida.Fecha,
                salida.CodSuplidor,
                salida.IdSuplidor,
                salida.Suplidor,
                salida.CodProducto,
                salida.IdProducto,
                salida.Producto,
                salida.CantidadEstandar,
                salida.CantidadAmbiente,
                salida.SiglasUnidad
            };
        }

        private object MapListadoMovimiento(SalidasDTO salida) => new
        {
            codigo = salida.CodSalida,
            salida.Fecha,
            salida.Suplidor,
            salida.Producto,
            salida.SiglasUnidad,
            salida.CantidadEstandar,
            salida.CantidadAmbiente
        };
    }
}
