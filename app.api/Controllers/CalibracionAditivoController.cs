using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.CalibracionAditivo;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalibracionAditivoController : ControllerBase
    {
        private readonly CalibracionAditivoDAO CalibracionAditivoDAO = new CalibracionAditivoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionAditivo, Permisos.Listar)]
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

                var pagina = CalibracionAditivoDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapCalibracionAditivo));
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
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = CalibracionAditivoDAO.ListarProductosAditivo();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionAditivo, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] CalibracionAditivoDTO Obj)
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

                MsjDB MsjDB = CalibracionAditivoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionAditivo, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idcalibracionaditivo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCalibracionAditivo = ObtenerCodCalibracionAditivo(idcalibracionaditivo);
                CalibracionAditivoDTO calibracion = CalibracionAditivoDAO.Obtener(CodCalibracionAditivo);

                if (calibracion.CodCalibracionAditivo <= 0)
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

                return Ok(MapCalibracionAditivo(calibracion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionAditivo, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] CalibracionAditivoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj.CodCalibracionAditivo <= 0)
                    return BadRequest(ManejadorErrores.Validacion("La calibracion aditivo es requerida."));

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = CalibracionAditivoDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionAditivo, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] CalibracionAditivoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj.CodCalibracionAditivo <= 0)
                    return BadRequest(ManejadorErrores.Validacion("La calibracion aditivo es requerida."));

                MsjDB MsjDB = CalibracionAditivoDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionAditivo, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idcalibracionaditivo)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCalibracionAditivo = ObtenerCodCalibracionAditivo(idcalibracionaditivo);
                return Ok(CalibracionAditivoDAO.Log(CodCalibracionAditivo));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string? ValidarCamposRequeridos(CalibracionAditivoDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            if (string.IsNullOrWhiteSpace(Obj.CodBahia))
                return "La bahia es requerida.";

            if (Obj.CodProducto <= 0)
                return "El producto es requerido.";

            if (Obj.CodPersonal <= 0)
                return "El tecnico es requerido.";

            if (Obj.CodCompaniaInspeccion <= 0)
                return "La compania de inspeccion es requerida.";

            if (!Obj.FechaCalibracion.HasValue)
                return "La fecha de calibracion es requerida.";

            return null;
        }

        private int ObtenerCodCalibracionAditivo(string idcalibracionaditivo)
        {
            if (int.TryParse(idcalibracionaditivo, out int valorDirecto))
                return valorDirecto;

            string CodCalibracionAditivo = Encriptacion.Desencriptar(idcalibracionaditivo);
            return int.TryParse(CodCalibracionAditivo, out int valor) ? valor : 0;
        }

        private object MapCalibracionAditivo(CalibracionAditivoDTO calibracion)
        {
            return new
            {
                calibracion.IdCalibracionAditivo,
                calibracion.CodCalibracionAditivo,
                calibracion.Fecha,
                calibracion.CodBahia,
                calibracion.IdBahia,
                calibracion.Bahia,
                calibracion.CodProducto,
                calibracion.IdProducto,
                calibracion.Producto,
                calibracion.CodPersonal,
                calibracion.IdPersonal,
                calibracion.Personal,
                calibracion.CodCompaniaInspeccion,
                calibracion.IdCompaniaInspeccion,
                calibracion.CompaniaInspeccion,
                calibracion.FechaCalibracion,
                calibracion.ProximaFecha,
                calibracion.Estatus
            };
        }
    }
}


