using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.VolumenTanque;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VolumenTanqueController : ControllerBase
    {
        private readonly VolumenTanqueDAO VolumenTanqueDAO = new VolumenTanqueDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.VolumenTanque, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
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

                var pagina = VolumenTanqueDAO.Listado(page, pageSize, search, sort, CodTanque);
                return Ok(pagina.Map(MapVolumenTanque));
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

                var lst = VolumenTanqueDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.VolumenTanque, Permisos.Visualizar)]
        [HttpGet("EsCombustible")]
        public IActionResult EsCombustible([FromQuery] string codtanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                return Ok(new { EsCombustible = VolumenTanqueDAO.EsCombustible(codtanque?.Trim() ?? "") });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.VolumenTanque, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idvolumentanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodDocumento = ObtenerCodDocumento(idvolumentanque);
                VolumenTanqueDTO VolumenTanque = VolumenTanqueDAO.Obtener(CodDocumento);

                if (VolumenTanque.CodDocumento <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapVolumenTanque(VolumenTanque));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpPost("CalcularVolumen")]
        public IActionResult CalcularVolumen([FromBody] VolumenTanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (!Accesos.Verificar(Menus.VolumenTanque, Permisos.Agregar)
                    && !Accesos.Verificar(Menus.VolumenTanque, Permisos.Editar)
                    && !Accesos.Verificar(Menus.VolumenTanque, Permisos.Visualizar))
                {
                    return StatusCode(403, ManejadorErrores.Crear(TipoError.SinPermiso));
                }

                string? validacion = ValidarCamposRequeridos(Obj);
                if (!string.IsNullOrWhiteSpace(validacion))
                    return BadRequest(ManejadorErrores.Validacion(validacion));

                MsjDB MsjDB = VolumenTanqueDAO.CalcularVolumen(Obj);
                if (!MsjDB.Estatus)
                    return BadRequest(ManejadorErrores.Validacion(MsjDB.Msj));

                return Ok(MapVolumenTanque(Obj));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.VolumenTanque, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] VolumenTanqueDTO Obj)
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

                MsjDB MsjDB = VolumenTanqueDAO.Agregar(Obj);
                if (!MsjDB.Estatus)
                    return BadRequest(ManejadorErrores.Validacion(MsjDB.Msj));
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.VolumenTanque, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] VolumenTanqueDTO Obj)
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

                MsjDB MsjDB = VolumenTanqueDAO.Editar(Obj);
                if (!MsjDB.Estatus)
                    return BadRequest(ManejadorErrores.Validacion(MsjDB.Msj));
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.VolumenTanque, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] VolumenTanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = VolumenTanqueDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.VolumenTanque, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idvolumentanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodDocumento = ObtenerCodDocumento(idvolumentanque);
                List<VolumenTanqueDTO> lst = VolumenTanqueDAO.Log(CodDocumento);
                return Ok(lst.Select(MapVolumenTanqueLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodDocumento(string idvolumentanque)
        {
            string CodDocumento = Encriptacion.Desencriptar(idvolumentanque);
            return int.TryParse(CodDocumento, out int valor) ? valor : 0;
        }

        private string ObtenerCodTanque(string idtanque)
        {
            if (string.IsNullOrWhiteSpace(idtanque))
                return "";

            string CodTanque = Encriptacion.Desencriptar(idtanque);
            return CodTanque.Trim();
        }

        private string? ValidarCamposRequeridos(VolumenTanqueDTO Obj)
        {
            if (Obj == null)
                return "Los campos requeridos son obligatorios.";

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
                return "La pulgadas debe estar entre 0 y 11.";

            if (Obj.Dieciseisavos > 15)
                return "Los 16avos deben estar entre 0 y 15.";

            return null;
        }

        private object MapVolumenTanque(VolumenTanqueDTO volumenTanque)
        {
            return new
            {
                volumenTanque.IdVolumenTanque,
                volumenTanque.CodDocumento,
                volumenTanque.Fecha,
                volumenTanque.CodTanque,
                IdTanque = string.IsNullOrWhiteSpace(volumenTanque.IdTanque) && !string.IsNullOrWhiteSpace(volumenTanque.CodTanque)
                    ? Encriptacion.Encriptar(volumenTanque.CodTanque)
                    : volumenTanque.IdTanque,
                volumenTanque.Tanque,
                volumenTanque.Pies,
                volumenTanque.Pulgadas,
                volumenTanque.Dieciseisavos,
                volumenTanque.Volumen,
                volumenTanque.MedidaAguaPies,
                volumenTanque.MedidaAguaPulgadas,
                volumenTanque.VolumenAgua,
                volumenTanque.CorreccionTecho,
                volumenTanque.Temperatura,
                volumenTanque.Api,
                volumenTanque.Factor,
                volumenTanque.VolumenAmbiente,
                volumenTanque.VolumenEstandar,
                volumenTanque.CapacidadMaxima,
                volumenTanque.CapacidadDisponible,
                volumenTanque.Estatus
            };
        }

        private object MapVolumenTanqueLog(VolumenTanqueDTO volumenTanque)
        {
            return new
            {
                volumenTanque.IdVolumenTanque,
                volumenTanque.CodDocumento,
                volumenTanque.Fecha,
                volumenTanque.CodTanque,
                IdTanque = string.IsNullOrWhiteSpace(volumenTanque.IdTanque) && !string.IsNullOrWhiteSpace(volumenTanque.CodTanque)
                    ? Encriptacion.Encriptar(volumenTanque.CodTanque)
                    : volumenTanque.IdTanque,
                volumenTanque.Tanque,
                volumenTanque.Pies,
                volumenTanque.Pulgadas,
                volumenTanque.Dieciseisavos,
                volumenTanque.Volumen,
                volumenTanque.MedidaAguaPies,
                volumenTanque.MedidaAguaPulgadas,
                volumenTanque.VolumenAgua,
                volumenTanque.CorreccionTecho,
                volumenTanque.Temperatura,
                volumenTanque.Api,
                volumenTanque.Factor,
                volumenTanque.VolumenAmbiente,
                volumenTanque.VolumenEstandar,
                volumenTanque.CapacidadMaxima,
                volumenTanque.CapacidadDisponible,
                volumenTanque.Version,
                volumenTanque.CodUsuarioCreacion,
                volumenTanque.IdUsuarioCreacion,
                volumenTanque.FechaCreacion,
                volumenTanque.CodUsuarioActualizacion,
                volumenTanque.IdUsuarioActualizacion,
                volumenTanque.FechaActualizacion,
                volumenTanque.CodUsuarioEliminacion,
                volumenTanque.IdUsuarioEliminacion,
                volumenTanque.FechaEliminacion,
                volumenTanque.AccionLog
            };
        }
    }
}
