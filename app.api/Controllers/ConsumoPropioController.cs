using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.ConsumoPropio;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConsumoPropioController : ControllerBase
    {
        private readonly ConsumoPropioDAO ConsumoPropioDAO = new ConsumoPropioDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConsumoPropio, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] string idtanque = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTanque = ObtenerCodTanque(idtanque);

                if (!string.IsNullOrWhiteSpace(idtanque) && string.IsNullOrWhiteSpace(CodTanque))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var pagina = ConsumoPropioDAO.Listado(page, pageSize, search, sort, CodTanque);
                return Ok(pagina.Map(MapConsumoPropio));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarOpcion")]
        public IActionResult ListarOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = ConsumoPropioDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConsumoPropio, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idconsumopropio)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodConsumoPropio = ObtenerCodConsumoPropio(idconsumopropio);
                ConsumoPropioDTO ConsumoPropio = ConsumoPropioDAO.Obtener(CodConsumoPropio);

                if (ConsumoPropio.CodConsumoPropio <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapConsumoPropio(ConsumoPropio));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConsumoPropio, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] ConsumoPropioDTO Obj)
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

                MsjDB MsjDB = ConsumoPropioDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConsumoPropio, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] ConsumoPropioDTO Obj)
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

                MsjDB MsjDB = ConsumoPropioDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConsumoPropio, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] ConsumoPropioDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = ConsumoPropioDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConsumoPropio, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idconsumopropio)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodConsumoPropio = ObtenerCodConsumoPropio(idconsumopropio);
                List<ConsumoPropioDTO> lst = ConsumoPropioDAO.Log(CodConsumoPropio);
                return Ok(lst.Select(MapConsumoPropioLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodConsumoPropio(string idconsumopropio)
        {
            string CodConsumoPropio = Encriptacion.Desencriptar(idconsumopropio);
            return int.TryParse(CodConsumoPropio, out int valor) ? valor : 0;
        }

        private string ObtenerCodTanque(string idtanque)
        {
            if (string.IsNullOrWhiteSpace(idtanque))
                return "";

            string CodTanque = Encriptacion.Desencriptar(idtanque);
            return CodTanque.Trim();
        }

        private string? ValidarCamposRequeridos(ConsumoPropioDTO Obj)
        {
            Obj.CodTanque = (Obj.CodTanque ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodTanque))
                return "El tanque es requerido.";

            if (Obj.CodTanque.Length > 20)
                return "El codigo del tanque no puede exceder 20 caracteres.";

            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            if (Obj.Pies < 0 || Obj.Pulgadas < 0 || Obj.Dieciseisavos < 0)
                return "La medicion no puede ser negativa.";

            if (Obj.Pulgadas > 11)
                return "Las pulgadas deben estar entre 0 y 11.";

            if (Obj.Dieciseisavos > 15)
                return "Los 16avos deben estar entre 0 y 15.";

            return null;
        }

        private object MapConsumoPropio(ConsumoPropioDTO consumoPropio)
        {
            return new
            {
                consumoPropio.IdConsumoPropio,
                consumoPropio.CodConsumoPropio,
                consumoPropio.CodTanque,
                consumoPropio.IdTanque,
                consumoPropio.Tanque,
                consumoPropio.Fecha,
                consumoPropio.Pies,
                consumoPropio.Pulgadas,
                consumoPropio.Dieciseisavos,
                consumoPropio.CantidadAnterior,
                consumoPropio.Cantidad,
                consumoPropio.CantidadActual
            };
        }

        private object MapConsumoPropioLog(ConsumoPropioDTO consumoPropio)
        {
            return new
            {
                consumoPropio.IdConsumoPropio,
                consumoPropio.CodConsumoPropio,
                consumoPropio.CodTanque,
                consumoPropio.IdTanque,
                consumoPropio.Tanque,
                consumoPropio.Fecha,
                consumoPropio.Pies,
                consumoPropio.Pulgadas,
                consumoPropio.Dieciseisavos,
                consumoPropio.CantidadAnterior,
                consumoPropio.Cantidad,
                consumoPropio.CantidadActual,
                consumoPropio.Version,
                consumoPropio.CodUsuarioCreacion,
                consumoPropio.IdUsuarioCreacion,
                consumoPropio.FechaCreacion,
                consumoPropio.CodUsuarioActualizacion,
                consumoPropio.IdUsuarioActualizacion,
                consumoPropio.FechaActualizacion
            };
        }
    }
}


