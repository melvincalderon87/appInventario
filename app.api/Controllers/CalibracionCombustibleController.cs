using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.CalibracionCombustible;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalibracionCombustibleController : ControllerBase
    {
        private readonly CalibracionCombustibleDAO CalibracionCombustibleDAO = new CalibracionCombustibleDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionCombustible, Permisos.Listar)]
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

                var pagina = CalibracionCombustibleDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapCalibracionCombustible));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarBrazoOpcion")]
        public IActionResult ListarBrazoOpcion([FromQuery] string codbahia = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = CalibracionCombustibleDAO.ListarBrazos(codbahia);
                return Ok(lst.Select(item => new { item.Value, item.Text }));
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

                var lst = CalibracionCombustibleDAO.ListarProductosCombustible();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionCombustible, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] CalibracionCombustibleDTO Obj)
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

                MsjDB MsjDB = CalibracionCombustibleDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionCombustible, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idcalibracioncombustible)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCalibracionCombustible = ObtenerCodCalibracionCombustible(idcalibracioncombustible);
                CalibracionCombustibleDTO calibracion = CalibracionCombustibleDAO.Obtener(CodCalibracionCombustible);

                if (calibracion.CodCalibracionCombustible <= 0)
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

                return Ok(MapCalibracionCombustible(calibracion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionCombustible, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] CalibracionCombustibleDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj.CodCalibracionCombustible <= 0)
                    return BadRequest(ManejadorErrores.Validacion("La calibracion de combustible es requerida."));

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = CalibracionCombustibleDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionCombustible, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] CalibracionCombustibleDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj.CodCalibracionCombustible <= 0)
                    return BadRequest(ManejadorErrores.Validacion("La calibracion de combustible es requerida."));

                MsjDB MsjDB = CalibracionCombustibleDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionCombustible, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idcalibracioncombustible)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCalibracionCombustible = ObtenerCodCalibracionCombustible(idcalibracioncombustible);
                return Ok(CalibracionCombustibleDAO.Log(CodCalibracionCombustible));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string? ValidarCamposRequeridos(CalibracionCombustibleDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return "La fecha de calibracion es requerida.";

            if (string.IsNullOrWhiteSpace(Obj.CodBahia))
                return "La bahia es requerida.";

            if (string.IsNullOrWhiteSpace(Obj.CodBrazo))
                return "El brazo es requerido.";

            if (Obj.CodProducto <= 0)
                return "El producto es requerido.";

            if (Obj.CodPersonal <= 0)
                return "El tecnico es requerido.";

            if (Obj.CodCompaniaInspeccion <= 0)
                return "La compania de inspeccion es requerida.";

            if (Obj.CantidadCalibracion <= 0)
                return "La cantidad de la calibracion debe ser mayor a cero.";

            return null;
        }

        private int ObtenerCodCalibracionCombustible(string idcalibracioncombustible)
        {
            if (int.TryParse(idcalibracioncombustible, out int valorDirecto))
                return valorDirecto;

            string CodCalibracionCombustible = Encriptacion.Desencriptar(idcalibracioncombustible);
            return int.TryParse(CodCalibracionCombustible, out int valor) ? valor : 0;
        }

        private object MapCalibracionCombustible(CalibracionCombustibleDTO calibracion)
        {
            return new
            {
                calibracion.IdCalibracionCombustible,
                calibracion.CodCalibracionCombustible,
                calibracion.Fecha,
                calibracion.ProximaFecha,
                calibracion.CodBahia,
                calibracion.IdBahia,
                calibracion.Bahia,
                calibracion.CodBrazo,
                calibracion.IdBrazo,
                calibracion.Brazo,
                calibracion.CodProducto,
                calibracion.IdProducto,
                calibracion.Producto,
                calibracion.CodPersonal,
                calibracion.IdPersonal,
                calibracion.Personal,
                calibracion.CodCompaniaInspeccion,
                calibracion.IdCompaniaInspeccion,
                calibracion.CompaniaInspeccion,
                calibracion.CantidadCalibracion,
                calibracion.HoraInicio,
                calibracion.HoraFinal,
                calibracion.TiempoTotal,
                calibracion.FactorCalibracion,
                calibracion.PorcentajeDesviacion,
                calibracion.VolumenBrutoFinalDespuesCalibrar,
                calibracion.VolumenFinalCalibracionAnterior,
                calibracion.VolumenEncontradoInicialCalibracion,
                calibracion.ProximoVolumenACalibrar,
                calibracion.VolumenDespachado,
                calibracion.Comentarios,
                calibracion.TemperaturaRack,
                calibracion.TemperaturaSerafin,
                calibracion.DiferenciaTemperaturas,
                calibracion.Estatus
            };
        }
    }
}


