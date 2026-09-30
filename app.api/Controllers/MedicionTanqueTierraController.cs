using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.MedicionTanqueTierra;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicionTanqueTierraController : ControllerBase
    {
        private readonly MedicionTanqueTierraDAO MedicionTanqueTierraDAO = new MedicionTanqueTierraDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.MedicionTanqueTierra, Permisos.Listar)]
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

                var pagina = MedicionTanqueTierraDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapMedicionTanqueTierra));
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

                var lst = MedicionTanqueTierraDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MedicionTanqueTierra, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idmediciontanquetierra)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodMedicionTanqueTierra = ObtenerCodMedicionTanqueTierra(idmediciontanquetierra);
                MedicionTanqueTierraDTO medicion = MedicionTanqueTierraDAO.Obtener(CodMedicionTanqueTierra);

                if (medicion.CodMedicionTanqueTierra <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapMedicionTanqueTierra(medicion));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("VolumenCalibracion")]
        public IActionResult VolumenCalibracion([FromQuery] string codtanque, [FromQuery] int codproducto, [FromQuery] int pies, [FromQuery] int pulgadas, [FromQuery] int dieciseisavos)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado)
                return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

            decimal? volumen = MedicionTanqueTierraDAO.ObtenerVolumenCalibracion(codtanque, codproducto, pies, pulgadas, dieciseisavos);
            return volumen.HasValue ? Ok(new { volumen = volumen.Value }) : NotFound(ManejadorErrores.Validacion("No existe una calibracion vigente para la medida indicada."));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MedicionTanqueTierra, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] MedicionTanqueTierraDTO Obj)
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

                MsjDB MsjDB = MedicionTanqueTierraDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MedicionTanqueTierra, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] MedicionTanqueTierraDTO Obj)
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

                MsjDB MsjDB = MedicionTanqueTierraDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MedicionTanqueTierra, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] MedicionTanqueTierraDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = MedicionTanqueTierraDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.MedicionTanqueTierra, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idmediciontanquetierra)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodMedicionTanqueTierra = ObtenerCodMedicionTanqueTierra(idmediciontanquetierra);
                List<MedicionTanqueTierraDTO> lst = MedicionTanqueTierraDAO.Log(CodMedicionTanqueTierra);
                return Ok(lst.Select(MapMedicionTanqueTierraLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodMedicionTanqueTierra(string idmediciontanquetierra)
        {
            string CodMedicionTanqueTierra = Encriptacion.Desencriptar(idmediciontanquetierra);
            return int.TryParse(CodMedicionTanqueTierra, out int valor) ? valor : 0;
        }

        private string? ValidarCamposRequeridos(MedicionTanqueTierraDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return "La fecha es requerida.";

            if (Obj.CodBarco <= 0)
                return "El barco es requerido.";

            if (Obj.CodSuplidor <= 0)
                return "El suplidor es requerido.";

            if (Obj.CodProducto <= 0)
                return "El producto es requerido.";

            if (Obj.CodCompaniaInspeccion <= 0)
                return "La compania de inspeccion es requerida.";

            if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                return "Debe agregar al menos una fila al detalle.";

            foreach (MedicionTanqueTierraDetalleDTO detalle in Obj.Detalles)
            {
                detalle.CodTanque = (detalle.CodTanque ?? "").Trim();

                if (string.IsNullOrWhiteSpace(detalle.CodTanque))
                    return "El tanque es requerido en todas las filas.";

                if (detalle.CodTanque.Length > 20)
                    return "El codigo del tanque no puede exceder 20 caracteres.";

                if (string.IsNullOrWhiteSpace(detalle.Tipo))
                    return "El tipo es requerido en todas las filas.";

                string tipo = detalle.Tipo.Trim().ToUpperInvariant();
                if (tipo != "O" && tipo != "C")
                    return "El tipo debe ser O o C en todas las filas.";

                if (!detalle.Fecha.HasValue)
                    return "La fecha es requerida en todas las filas.";

                if (string.IsNullOrWhiteSpace(detalle.Hora))
                    return "La hora es requerida en todas las filas.";

                if (detalle.Pulgadas < 0 || detalle.Pulgadas > 11)
                    return "La medida del tanque en pulgadas debe estar entre 0 y 11.";

                if (detalle.MedidaAguaPulgadas < 0 || detalle.MedidaAguaPulgadas > 11)
                    return "La medida de agua en pulgadas debe estar entre 0 y 11.";

                if (detalle.Volumen <= 0)
                    return "El total volumen debe ser mayor a cero en todas las filas.";

                if (detalle.VolumenBrutoObservado <= 0)
                    return "El volumen bruto observado debe ser mayor a cero en todas las filas.";

                if (detalle.Temperatura <= 0)
                    return "La temperatura debe ser mayor a cero en todas las filas.";

                if (detalle.Api <= 0)
                    return "El API debe ser mayor a cero en todas las filas.";

                if (detalle.Factor <= 0)
                    return "El factor debe ser mayor a cero en todas las filas.";

                if (detalle.VolumenEstandarBruto <= 0)
                    return "El volumen estandar bruto debe ser mayor a cero en todas las filas.";
            }

            return null;
        }

        private object MapMedicionTanqueTierra(MedicionTanqueTierraDTO medicion)
        {
            return new
            {
                medicion.IdMedicionTanqueTierra,
                medicion.CodMedicionTanqueTierra,
                medicion.Fecha,
                medicion.CodBarco,
                medicion.IdBarco,
                medicion.Barco,
                medicion.CodSuplidor,
                medicion.IdSuplidor,
                medicion.Suplidor,
                medicion.CodProducto,
                medicion.IdProducto,
                medicion.Producto,
                medicion.CodCompaniaInspeccion,
                medicion.IdCompaniaInspeccion,
                medicion.CompaniaInspeccion,
                medicion.DetalleCantidad,
                medicion.VolumenEstandarBrutoTotal,
                medicion.Estatus,
                Detalles = medicion.Detalles.Select(MapDetalle)
            };
        }

        private object MapMedicionTanqueTierraLog(MedicionTanqueTierraDTO medicion)
        {
            return new
            {
                medicion.IdMedicionTanqueTierra,
                medicion.CodMedicionTanqueTierra,
                medicion.Fecha,
                medicion.CodBarco,
                medicion.IdBarco,
                medicion.Barco,
                medicion.CodSuplidor,
                medicion.IdSuplidor,
                medicion.Suplidor,
                medicion.CodProducto,
                medicion.IdProducto,
                medicion.Producto,
                medicion.CodCompaniaInspeccion,
                medicion.IdCompaniaInspeccion,
                medicion.CompaniaInspeccion,
                medicion.Version,
                medicion.CodUsuarioCreacion,
                medicion.IdUsuarioCreacion,
                medicion.FechaCreacion,
                medicion.CodUsuarioActualizacion,
                medicion.IdUsuarioActualizacion,
                medicion.FechaActualizacion,
                medicion.CodUsuarioEliminacion,
                medicion.IdUsuarioEliminacion,
                medicion.FechaEliminacion,
                medicion.AccionLog
            };
        }

        private object MapDetalle(MedicionTanqueTierraDetalleDTO detalle)
        {
            return new
            {
                detalle.IdMedicionTanqueTierraDetalle,
                detalle.CodMedicionTanqueTierraDetalle,
                detalle.CodMedicionTanqueTierra,
                detalle.IdMedicionTanqueTierra,
                detalle.Linea,
                detalle.CodTanque,
                detalle.IdTanque,
                detalle.Tanque,
                detalle.Tipo,
                detalle.Fecha,
                detalle.Hora,
                detalle.Pies,
                detalle.Pulgadas,
                detalle.Dieciseisavos,
                detalle.Volumen,
                detalle.CorreccionTecho,
                detalle.MedidaAguaPies,
                detalle.MedidaAguaPulgadas,
                detalle.VolumenAguaLibre,
                detalle.VolumenBrutoObservado,
                detalle.Temperatura,
                detalle.Api,
                detalle.Factor,
                detalle.VolumenEstandarBruto
            };
        }
    }
}
