using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.CalibracionEtanol;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalibracionEtanolController : ControllerBase
    {
        private readonly CalibracionEtanolDAO CalibracionEtanolDAO = new CalibracionEtanolDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionEtanol, Permisos.Listar)]
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

                var pagina = CalibracionEtanolDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapCalibracionEtanol));
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

                var lst = CalibracionEtanolDAO.ListarBrazos(codbahia);
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

                var lst = CalibracionEtanolDAO.ListarProductosEtanol();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionEtanol, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] CalibracionEtanolDTO Obj)
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

                MsjDB MsjDB = CalibracionEtanolDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionEtanol, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idcalibracionetanol)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCalibracionEtanol = ObtenerCodCalibracionEtanol(idcalibracionetanol);
                CalibracionEtanolDTO calibracion = CalibracionEtanolDAO.Obtener(CodCalibracionEtanol);

                if (calibracion.CodCalibracionEtanol <= 0)
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

                return Ok(MapCalibracionEtanol(calibracion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionEtanol, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] CalibracionEtanolDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj.CodCalibracionEtanol <= 0)
                    return BadRequest(ManejadorErrores.Validacion("La calibracion etanol es requerida."));

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = CalibracionEtanolDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionEtanol, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] CalibracionEtanolDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (Obj.CodCalibracionEtanol <= 0)
                    return BadRequest(ManejadorErrores.Validacion("La calibracion etanol es requerida."));

                MsjDB MsjDB = CalibracionEtanolDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CalibracionEtanol, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idcalibracionetanol)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCalibracionEtanol = ObtenerCodCalibracionEtanol(idcalibracionetanol);
                return Ok(CalibracionEtanolDAO.Log(CodCalibracionEtanol));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string? ValidarCamposRequeridos(CalibracionEtanolDTO Obj)
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

        private int ObtenerCodCalibracionEtanol(string idcalibracionetanol)
        {
            if (int.TryParse(idcalibracionetanol, out int valorDirecto))
                return valorDirecto;

            string CodCalibracionEtanol = Encriptacion.Desencriptar(idcalibracionetanol);
            return int.TryParse(CodCalibracionEtanol, out int valor) ? valor : 0;
        }

        private object MapCalibracionEtanol(CalibracionEtanolDTO calibracion)
        {
            return new
            {
                calibracion.IdCalibracionEtanol,
                calibracion.CodCalibracionEtanol,
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


