using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.CapacidadVolumetricaTanque;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CapacidadVolumetricaTanqueController : ControllerBase
    {
        private readonly CapacidadVolumetricaTanqueDAO CapacidadVolumetricaTanqueDAO = new CapacidadVolumetricaTanqueDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] string idtanque = "",
            [FromQuery] bool soloactuales = false,
            [FromQuery] bool solohistoricas = false)
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

                var pagina = CapacidadVolumetricaTanqueDAO.Listado(page, pageSize, search, sort, CodTanque, soloactuales, solohistoricas);
                return Ok(pagina.Map(MapCapacidadVolumetricaTanque));
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

                var lst = CapacidadVolumetricaTanqueDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idcapacidadvolumetricatanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCapacidadVolumetricaTanque = ObtenerCodCapacidadVolumetricaTanque(idcapacidadvolumetricatanque);
                CapacidadVolumetricaTanqueDTO CapacidadVolumetricaTanque = CapacidadVolumetricaTanqueDAO.Obtener(CodCapacidadVolumetricaTanque);

                if (CapacidadVolumetricaTanque.CodCapacidadVolumetricaTanque <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapCapacidadVolumetricaTanque(CapacidadVolumetricaTanque));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Visualizar)]
        [HttpGet("Archivo")]
        public IActionResult Archivo([FromQuery] string idcapacidadvolumetricatanque, [FromQuery] int codcapacidadvolumetricatanqueadjunto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCapacidadVolumetricaTanque = ObtenerCodCapacidadVolumetricaTanque(idcapacidadvolumetricatanque);
                CapacidadVolumetricaTanqueAdjuntoDTO adjunto = CapacidadVolumetricaTanqueDAO.ObtenerAdjunto(
                    CodCapacidadVolumetricaTanque,
                    codcapacidadvolumetricatanqueadjunto
                );

                if (adjunto.CodCapacidadVolumetricaTanqueAdjunto <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = CapacidadVolumetricaTanqueDAO.LeerArchivoAdjunto(adjunto);
                if (contenido.Length == 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return File(contenido, adjunto.TipoContenido, adjunto.NombreArchivo);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] CapacidadVolumetricaTanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                IActionResult? validacion = ValidarDocumento(Obj);
                if (validacion != null)
                    return validacion;

                MsjDB MsjDB = CapacidadVolumetricaTanqueDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] CapacidadVolumetricaTanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                IActionResult? validacion = ValidarDocumento(Obj);
                if (validacion != null)
                    return validacion;

                MsjDB MsjDB = CapacidadVolumetricaTanqueDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] CapacidadVolumetricaTanqueDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = CapacidadVolumetricaTanqueDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Agregar)]
        [HttpPost("ReemplazarPlantilla")]
        public IActionResult ReemplazarPlantilla([FromBody] CapacidadVolumetricaTanquePlantillaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                if (!Accesos.Verificar(Menus.CapacidadVolumetricaTanque, Permisos.Agregar))
                {
                    return StatusCode(403, ManejadorErrores.Crear(TipoError.SinPermiso));
                }

                if (Obj == null)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.PlantillaInvalida));
                }

                string CodTanque = ObtenerCodTanque(Obj.IdTanque ?? "");
                if (string.IsNullOrWhiteSpace(CodTanque))
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                if (Obj.CodProducto <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "Producto"));
                }

                if (Obj.CodCompaniaInspeccion <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "CompaniaInspeccion"));
                }

                if (!Obj.FechaCalibracion.HasValue)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "FechaCalibracion"));
                }

                if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.PlantillaSinDatos));
                }

                IActionResult? validacionDetalles = ValidarDetalles(Obj.Detalles, CodTanque);
                if (validacionDetalles != null)
                {
                    return validacionDetalles;
                }

                MsjDB MsjDB = CapacidadVolumetricaTanqueDAO.ImportarPlantilla(
                    CodTanque,
                    Obj.CodProducto,
                    Obj.CodCompaniaInspeccion,
                    Obj.FechaCalibracion.Value,
                    Obj.Comentarios,
                    Obj.Detalles
                );
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idcapacidadvolumetricatanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCapacidadVolumetricaTanque = ObtenerCodCapacidadVolumetricaTanque(idcapacidadvolumetricatanque);
                List<CapacidadVolumetricaTanqueDTO> lst = CapacidadVolumetricaTanqueDAO.Log(CodCapacidadVolumetricaTanque);
                return Ok(lst.Select(MapCapacidadVolumetricaTanqueLog));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodCapacidadVolumetricaTanque(string idcapacidadvolumetricatanque)
        {
            string CodCapacidadVolumetricaTanque = Encriptacion.Desencriptar(idcapacidadvolumetricatanque);
            return int.TryParse(CodCapacidadVolumetricaTanque, out int valor) ? valor : 0;
        }

        private string ObtenerCodTanque(string idtanque)
        {
            if (string.IsNullOrWhiteSpace(idtanque))
                return "";

            string CodTanque = Encriptacion.Desencriptar(idtanque);
            return CodTanque.Trim();
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Agregar)]
        [HttpPost("ImportarPlantillaDirecta")]
        public IActionResult ImportarPlantillaDirecta([FromBody] CapacidadVolumetricaTanquePlantillaDirectaDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                if (!Accesos.Verificar(Menus.CapacidadVolumetricaTanque, Permisos.Agregar))
                    return StatusCode(403, ManejadorErrores.Crear(TipoError.SinPermiso));

                if (Obj == null)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.PlantillaInvalida));

                string CodTanque = ObtenerCodTanque(Obj.IdTanque ?? "");
                if (string.IsNullOrWhiteSpace(CodTanque))
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));

                int CodProducto = CapacidadVolumetricaTanqueDAO.ObtenerProductoTanque(CodTanque);
                if (CodProducto <= 0)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));

                if (Obj.CodCompaniaInspeccion <= 0)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "CompaniaInspeccion"));

                if (!Obj.FechaCalibracion.HasValue)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "FechaCalibracion"));

                if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.PlantillaSinDatos));

                IActionResult? validacionDetalles = ValidarDetalles(Obj.Detalles, CodTanque);
                if (validacionDetalles != null)
                    return validacionDetalles;

                MsjDB MsjDB = CapacidadVolumetricaTanqueDAO.ImportarPlantillaDirecta(
                    CodTanque, CodProducto, Obj.CodCompaniaInspeccion, Obj.FechaCalibracion.Value, Obj.Comentarios, Obj.Detalles);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Visualizar)]
        [HttpGet("Resumen")]
        public IActionResult Resumen([FromQuery] string idcapacidadvolumetricatanque)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                int codigo = ObtenerCodCapacidadVolumetricaTanque(idcapacidadvolumetricatanque);
                CapacidadVolumetricaTanqueDTO documento = CapacidadVolumetricaTanqueDAO.ObtenerResumen(codigo);
                if (documento.CodCapacidadVolumetricaTanque <= 0)
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));

                return Ok(MapCapacidadVolumetricaTanqueResumen(documento));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.CapacidadVolumetricaTanque, Permisos.Visualizar)]
        [HttpGet("ListadoDetalle")]
        public IActionResult ListadoDetalle(
            [FromQuery] string idcapacidadvolumetricatanque,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] int? pies = null,
            [FromQuery] int? pulgadas = null,
            [FromQuery] int? dieciseisavos = null)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));

                int codigo = ObtenerCodCapacidadVolumetricaTanque(idcapacidadvolumetricatanque);
                if (codigo <= 0)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));

                var pagina = CapacidadVolumetricaTanqueDAO.ListadoDetalles(codigo, page, pageSize, search, sort, pies, pulgadas, dieciseisavos);
                return Ok(pagina.Map(MapDetalle));
            }
            catch (Exception)
            {
                throw;
            }
        }

        private IActionResult? ValidarDocumento(CapacidadVolumetricaTanqueDTO Obj)
        {
            if (Obj == null)
                return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos));

            Obj.CodTanque = (Obj.CodTanque ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodTanque))
                return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "Tanque"));

            if (Obj.CodTanque.Length > 20)
                return BadRequest(ManejadorErrores.Validacion(TipoError.ValorFueraDeRango, "Tanque"));

            if (Obj.CodProducto <= 0)
                return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "Producto"));

            if (Obj.CodCompaniaInspeccion <= 0)
                return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "CompaniaInspeccion"));

            if (!Obj.FechaCalibracion.HasValue)
                return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "FechaCalibracion"));

            CompletarDetallesWizardDesdeDetalleFinal(Obj);

            IActionResult? validacionBase = ValidarDetallesBase(Obj.DetallesBase);
            if (validacionBase != null)
                return validacionBase;

            IActionResult? validacionFracciones = ValidarDetallesFracciones(Obj.DetallesFracciones);
            if (validacionFracciones != null)
                return validacionFracciones;

            Obj.Detalles = CalcularDetallesFinales(Obj.DetallesBase, Obj.DetallesFracciones);

            if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                return BadRequest(ManejadorErrores.Validacion(TipoError.PlantillaSinDatos));

            return ValidarDetalles(Obj.Detalles, Obj.CodTanque);
        }

        private IActionResult? ValidarDetallesBase(List<CapacidadVolumetricaTanqueDetalle2DTO> detalles)
        {
            if (detalles == null || detalles.Count < 2)
                return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "Paso 1"));

            HashSet<string> alturas = new HashSet<string>();
            List<CapacidadVolumetricaTanqueDetalle2DTO> ordenados = detalles
                .OrderBy(TotalDieciseisavosBase)
                .ToList();

            for (int index = 0; index < ordenados.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalle2DTO item = ordenados[index];
                int fila = index + 1;

                if (item.Pies < 0)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ValorFueraDeRango, "Paso 1 fila " + fila + ": Pies"));

                if (item.Pulgadas < 0 || item.Pulgadas > 11)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ValorFueraDeRango, "Paso 1 fila " + fila + ": Pulgadas"));

                if (item.Volumen <= 0)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ValorDebeSerMayorACero, "Paso 1 fila " + fila + ": Volumen"));

                string llaveAltura = item.Pies + "-" + item.Pulgadas;
                if (!alturas.Add(llaveAltura))
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado, "Paso 1 fila " + fila + ": Altura"));

                if (index > 0 && TotalDieciseisavosBase(item) - TotalDieciseisavosBase(ordenados[index - 1]) != 16)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ValorFueraDeRango, "Paso 1: pulgadas consecutivas"));
            }

            return null;
        }

        private IActionResult? ValidarDetallesFracciones(List<CapacidadVolumetricaTanqueDetalle3DTO> detalles)
        {
            if (detalles == null || detalles.Count == 0)
                return BadRequest(ManejadorErrores.Validacion(TipoError.CamposRequeridos, "Paso 2"));

            HashSet<int> fracciones = new HashSet<int>();
            for (int index = 0; index < detalles.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalle3DTO item = detalles[index];
                int fila = index + 1;

                if (item.Dieciseisavos <= 0 || item.Dieciseisavos > 15)
                    return BadRequest(ManejadorErrores.Validacion(TipoError.ValorFueraDeRango, "Paso 2 fila " + fila + ": 16avos"));

                if (!fracciones.Add(item.Dieciseisavos))
                    return BadRequest(ManejadorErrores.Validacion(TipoError.RegistroDuplicado, "Paso 2 fila " + fila + ": 16avos"));
            }

            return null;
        }

        private IActionResult? ValidarDetalles(List<CapacidadVolumetricaTanqueDetalleDTO> detalles, string CodTanque)
        {
            HashSet<string> alturas = new HashSet<string>();
            for (int index = 0; index < detalles.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalleDTO item = detalles[index];
                int fila = index + 1;

                if (item.Pies < 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(
                        TipoError.ValorFueraDeRango,
                        "Fila " + fila + ": Pies"
                    ));
                }

                if (item.Pulgadas < 0 || item.Pulgadas > 11)
                {
                    return BadRequest(ManejadorErrores.Validacion(
                        TipoError.ValorFueraDeRango,
                        "Fila " + fila + ": Pulgadas"
                    ));
                }

                if (item.Dieciseisavos < 0 || item.Dieciseisavos > 15)
                {
                    return BadRequest(ManejadorErrores.Validacion(
                        TipoError.ValorFueraDeRango,
                        "Fila " + fila + ": AlturaFraccion"
                    ));
                }

                if (item.Volumen <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(
                        TipoError.ValorDebeSerMayorACero,
                        "Fila " + fila + ": Volumen"
                    ));
                }

                string llaveAltura = item.Pies + "-" + item.Pulgadas + "-" + item.Dieciseisavos;
                if (!alturas.Add(llaveAltura))
                {
                    return BadRequest(ManejadorErrores.Validacion(
                        TipoError.RegistroDuplicado,
                        "Fila " + fila + ": Altura"
                    ));
                }

                item.CodCapacidadVolumetricaTanque = 0;
            }

            return null;
        }

        private void CompletarDetallesWizardDesdeDetalleFinal(CapacidadVolumetricaTanqueDTO Obj)
        {
            Obj.Detalles ??= new List<CapacidadVolumetricaTanqueDetalleDTO>();
            Obj.DetallesBase ??= new List<CapacidadVolumetricaTanqueDetalle2DTO>();
            Obj.DetallesFracciones ??= new List<CapacidadVolumetricaTanqueDetalle3DTO>();

            if (Obj.DetallesBase.Count == 0)
            {
                Obj.DetallesBase = Obj.Detalles
                    .Where(detalle => detalle.Dieciseisavos == 0)
                    .Select(detalle => new CapacidadVolumetricaTanqueDetalle2DTO
                    {
                        Pies = detalle.Pies,
                        Pulgadas = detalle.Pulgadas,
                        Volumen = detalle.Volumen
                    })
                    .ToList();
            }

            if (Obj.DetallesFracciones.Count == 0)
            {
                Obj.DetallesFracciones = Obj.Detalles
                    .Where(detalle => detalle.Dieciseisavos > 0 && detalle.Dieciseisavos < 16)
                    .Select(detalle => detalle.Dieciseisavos)
                    .Distinct()
                    .OrderBy(fraccion => fraccion)
                    .Select(fraccion => new CapacidadVolumetricaTanqueDetalle3DTO
                    {
                        Dieciseisavos = fraccion,
                    })
                    .ToList();
            }
        }

        private List<CapacidadVolumetricaTanqueDetalleDTO> CalcularDetallesFinales(
            List<CapacidadVolumetricaTanqueDetalle2DTO> detallesBase,
            List<CapacidadVolumetricaTanqueDetalle3DTO> detallesFracciones)
        {
            List<CapacidadVolumetricaTanqueDetalleDTO> calculados = new List<CapacidadVolumetricaTanqueDetalleDTO>();
            List<CapacidadVolumetricaTanqueDetalle2DTO> baseOrdenada = detallesBase
                .OrderBy(TotalDieciseisavosBase)
                .ToList();
            List<int> fracciones = detallesFracciones
                .Select(detalle => detalle.Dieciseisavos)
                .Distinct()
                .OrderBy(fraccion => fraccion)
                .ToList();

            for (int index = 0; index < baseOrdenada.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalle2DTO actual = baseOrdenada[index];
                calculados.Add(CrearDetalleFinal(actual, 0, actual.Volumen));

                if (index >= baseOrdenada.Count - 1)
                    continue;

                CapacidadVolumetricaTanqueDetalle2DTO siguiente = baseOrdenada[index + 1];
                if (TotalDieciseisavosBase(siguiente) - TotalDieciseisavosBase(actual) != 16)
                    continue;

                decimal diferenciaVolumen = siguiente.Volumen - actual.Volumen;
                foreach (int fraccion in fracciones)
                {
                    decimal volumen = decimal.Round(actual.Volumen + (diferenciaVolumen * fraccion / 16m), 4, MidpointRounding.AwayFromZero);
                    calculados.Add(CrearDetalleFinal(actual, fraccion, volumen));
                }
            }

            return calculados.OrderBy(TotalDieciseisavos).ToList();
        }

        private CapacidadVolumetricaTanqueDetalleDTO CrearDetalleFinal(CapacidadVolumetricaTanqueDetalle2DTO detalleBase, int fraccion, decimal volumen)
        {
            return new CapacidadVolumetricaTanqueDetalleDTO
            {
                Pies = detalleBase.Pies,
                Pulgadas = detalleBase.Pulgadas,
                Dieciseisavos = fraccion,
                Volumen = volumen
            };
        }

        private int TotalDieciseisavosBase(CapacidadVolumetricaTanqueDetalle2DTO detalle)
        {
            return ((detalle.Pies * 12) + detalle.Pulgadas) * 16;
        }

        private int TotalDieciseisavos(CapacidadVolumetricaTanqueDetalleDTO detalle)
        {
            return ((detalle.Pies * 12) + detalle.Pulgadas) * 16 + detalle.Dieciseisavos;
        }

        private object MapCapacidadVolumetricaTanque(CapacidadVolumetricaTanqueDTO capacidadVolumetricaTanque)
        {
            return new
            {
                capacidadVolumetricaTanque.IdCapacidadVolumetricaTanque,
                capacidadVolumetricaTanque.CodCapacidadVolumetricaTanque,
                capacidadVolumetricaTanque.CodTanque,
                capacidadVolumetricaTanque.IdTanque,
                capacidadVolumetricaTanque.Tanque,
                capacidadVolumetricaTanque.CodProducto,
                capacidadVolumetricaTanque.IdProducto,
                capacidadVolumetricaTanque.Producto,
                capacidadVolumetricaTanque.CodCompaniaInspeccion,
                capacidadVolumetricaTanque.IdCompaniaInspeccion,
                capacidadVolumetricaTanque.CompaniaInspeccion,
                capacidadVolumetricaTanque.FechaCalibracion,
                capacidadVolumetricaTanque.Comentarios,
                capacidadVolumetricaTanque.EsActual,
                capacidadVolumetricaTanque.DetalleCantidad,
                capacidadVolumetricaTanque.Estatus,
                capacidadVolumetricaTanque.AdjuntoCantidad,
                Detalles = capacidadVolumetricaTanque.Detalles.Select(MapDetalle),
                DetallesBase = capacidadVolumetricaTanque.DetallesBase.Select(MapDetalleBase),
                DetallesFracciones = capacidadVolumetricaTanque.DetallesFracciones.Select(MapDetalleFraccion),
                Adjuntos = (capacidadVolumetricaTanque.Adjuntos ?? new List<CapacidadVolumetricaTanqueAdjuntoDTO>()).Select(adjunto => new
                {
                    adjunto.CodCapacidadVolumetricaTanqueAdjunto,
                    adjunto.CodCapacidadVolumetricaTanque,
                    adjunto.NombreArchivo,
                    adjunto.TipoContenido,
                    adjunto.TamanoBytes,
                    adjunto.RutaArchivo
                })
            };
        }

        private object MapCapacidadVolumetricaTanqueResumen(CapacidadVolumetricaTanqueDTO capacidadVolumetricaTanque)
        {
            return new
            {
                capacidadVolumetricaTanque.IdCapacidadVolumetricaTanque,
                capacidadVolumetricaTanque.CodCapacidadVolumetricaTanque,
                capacidadVolumetricaTanque.CodTanque,
                capacidadVolumetricaTanque.IdTanque,
                capacidadVolumetricaTanque.Tanque,
                capacidadVolumetricaTanque.CodProducto,
                capacidadVolumetricaTanque.IdProducto,
                capacidadVolumetricaTanque.Producto,
                capacidadVolumetricaTanque.CodCompaniaInspeccion,
                capacidadVolumetricaTanque.IdCompaniaInspeccion,
                capacidadVolumetricaTanque.CompaniaInspeccion,
                capacidadVolumetricaTanque.FechaCalibracion,
                capacidadVolumetricaTanque.Comentarios,
                capacidadVolumetricaTanque.EsActual,
                capacidadVolumetricaTanque.DetalleCantidad,
                capacidadVolumetricaTanque.AdjuntoCantidad
            };
        }

        private object MapCapacidadVolumetricaTanqueLog(CapacidadVolumetricaTanqueDTO capacidadVolumetricaTanque)
        {
            return new
            {
                capacidadVolumetricaTanque.IdCapacidadVolumetricaTanque,
                capacidadVolumetricaTanque.CodCapacidadVolumetricaTanque,
                capacidadVolumetricaTanque.CodTanque,
                capacidadVolumetricaTanque.IdTanque,
                capacidadVolumetricaTanque.Tanque,
                capacidadVolumetricaTanque.CodProducto,
                capacidadVolumetricaTanque.IdProducto,
                capacidadVolumetricaTanque.Producto,
                capacidadVolumetricaTanque.CodCompaniaInspeccion,
                capacidadVolumetricaTanque.IdCompaniaInspeccion,
                capacidadVolumetricaTanque.CompaniaInspeccion,
                capacidadVolumetricaTanque.FechaCalibracion,
                capacidadVolumetricaTanque.Comentarios,
                capacidadVolumetricaTanque.EsActual,
                capacidadVolumetricaTanque.Version,
                capacidadVolumetricaTanque.CodUsuarioCreacion,
                capacidadVolumetricaTanque.IdUsuarioCreacion,
                capacidadVolumetricaTanque.FechaCreacion,
                capacidadVolumetricaTanque.CodUsuarioActualizacion,
                capacidadVolumetricaTanque.IdUsuarioActualizacion,
                capacidadVolumetricaTanque.FechaActualizacion,
                capacidadVolumetricaTanque.CodUsuarioEliminacion,
                capacidadVolumetricaTanque.IdUsuarioEliminacion,
                capacidadVolumetricaTanque.FechaEliminacion,
                capacidadVolumetricaTanque.AccionLog
            };
        }

        private object MapDetalle(CapacidadVolumetricaTanqueDetalleDTO detalle)
        {
            return new
            {
                detalle.IdCapacidadVolumetricaTanqueDetalle,
                detalle.CodCapacidadVolumetricaTanqueDetalle,
                detalle.CodCapacidadVolumetricaTanque,
                detalle.IdCapacidadVolumetricaTanque,
                detalle.Pies,
                detalle.Pulgadas,
                detalle.Dieciseisavos,
                detalle.Volumen
            };
        }

        private object MapDetalleBase(CapacidadVolumetricaTanqueDetalle2DTO detalle)
        {
            return new
            {
                detalle.IdCapacidadVolumetricaTanqueDetalle2,
                detalle.CodCapacidadVolumetricaTanqueDetalle2,
                detalle.CodCapacidadVolumetricaTanque,
                detalle.IdCapacidadVolumetricaTanque,
                detalle.Pies,
                detalle.Pulgadas,
                detalle.Volumen
            };
        }

        private object MapDetalleFraccion(CapacidadVolumetricaTanqueDetalle3DTO detalle)
        {
            return new
            {
                detalle.IdCapacidadVolumetricaTanqueDetalle3,
                detalle.CodCapacidadVolumetricaTanqueDetalle3,
                detalle.CodCapacidadVolumetricaTanque,
                detalle.IdCapacidadVolumetricaTanque,
                detalle.Dieciseisavos,
                detalle.Volumen
            };
        }
    }
}


