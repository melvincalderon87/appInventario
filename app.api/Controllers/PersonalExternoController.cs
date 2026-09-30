using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.PersonalExterno;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonalExternoController : ControllerBase
    {
        private readonly PersonalExternoDAO PersonalExternoDAO = new PersonalExternoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.PersonalExterno, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string search = "",
            [FromQuery] string sort = "",
            [FromQuery] string idcompaniainspeccion = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCompaniaInspeccion = ObtenerCodCompaniaInspeccion(idcompaniainspeccion);
                if (!string.IsNullOrWhiteSpace(idcompaniainspeccion) && CodCompaniaInspeccion <= 0)
                {
                    return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
                }

                var pagina = PersonalExternoDAO.Listado(page, pageSize, search, sort, CodCompaniaInspeccion);
                return Ok(pagina.Map(MapPersonalExterno));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarOpcion")]
        public IActionResult ListarOpcion([FromQuery] string idcompaniainspeccion = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodCompaniaInspeccion = ObtenerCodCompaniaInspeccion(idcompaniainspeccion);
                var lst = PersonalExternoDAO.Listar(CodCompaniaInspeccion);
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.PersonalExterno, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idpersonalexterno)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodPersonalExterno = ObtenerCodPersonalExterno(idpersonalexterno);
                PersonalExternoDTO PersonalExterno = PersonalExternoDAO.Obtener(CodPersonalExterno);

                if (PersonalExterno.CodPersonalExterno <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapPersonalExterno(PersonalExterno));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.PersonalExterno, Permisos.Visualizar)]
        [HttpGet("Foto")]
        public IActionResult Foto([FromQuery] string idpersonalexterno)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodPersonalExterno = ObtenerCodPersonalExterno(idpersonalexterno);
                PersonalExternoDTO PersonalExterno = PersonalExternoDAO.Obtener(CodPersonalExterno);

                if (PersonalExterno.CodPersonalExterno <= 0 || string.IsNullOrWhiteSpace(PersonalExterno.FotoRutaArchivo))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = PersonalExternoDAO.LeerFoto(PersonalExterno);
                if (contenido.Length == 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return File(contenido, PersonalExterno.FotoTipoContenido, PersonalExterno.FotoNombreArchivo);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.PersonalExterno, Permisos.Visualizar)]
        [HttpGet("Archivo")]
        public IActionResult Archivo([FromQuery] string idpersonalexterno, [FromQuery] int codpersonalexternoadjunto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodPersonalExterno = ObtenerCodPersonalExterno(idpersonalexterno);
                PersonalExternoAdjuntoDTO adjunto = PersonalExternoDAO.ObtenerAdjunto(CodPersonalExterno, codpersonalexternoadjunto);

                if (adjunto.CodPersonalExternoAdjunto <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = PersonalExternoDAO.LeerArchivoAdjunto(adjunto);
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
        [RequierePermiso(Menus.PersonalExterno, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] PersonalExternoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = PersonalExternoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.PersonalExterno, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] PersonalExternoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = PersonalExternoDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.PersonalExterno, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] PersonalExternoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = PersonalExternoDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.PersonalExterno, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idpersonalexterno)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodPersonalExterno = ObtenerCodPersonalExterno(idpersonalexterno);
                List<PersonalExternoDTO> lst = PersonalExternoDAO.Log(CodPersonalExterno);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodPersonalExterno(string idpersonalexterno)
        {
            if (int.TryParse(idpersonalexterno, out int valorDirecto))
                return valorDirecto;

            string CodPersonalExterno = Encriptacion.Desencriptar(idpersonalexterno);
            return int.TryParse(CodPersonalExterno, out int valor) ? valor : 0;
        }

        private int ObtenerCodCompaniaInspeccion(string idcompaniainspeccion)
        {
            if (string.IsNullOrWhiteSpace(idcompaniainspeccion))
                return 0;

            if (int.TryParse(idcompaniainspeccion, out int valorDirecto))
                return valorDirecto;

            string CodCompaniaInspeccion = Encriptacion.Desencriptar(idcompaniainspeccion);
            return int.TryParse(CodCompaniaInspeccion, out int valor) ? valor : 0;
        }

        private object MapPersonalExterno(PersonalExternoDTO personalExterno)
        {
            return new
            {
                personalExterno.IdPersonalExterno,
                personalExterno.CodPersonalExterno,
                personalExterno.IdCompaniaInspeccion,
                personalExterno.CodCompaniaInspeccion,
                personalExterno.CompaniaInspeccion,
                personalExterno.CodTecnico,
                personalExterno.Nombre,
                personalExterno.Puesto,
                personalExterno.EsTecnico,
                personalExterno.FotoNombreArchivo,
                personalExterno.FotoTipoContenido,
                personalExterno.FotoTamanoBytes,
                personalExterno.FotoRutaArchivo,
                personalExterno.Estatus,
                personalExterno.AdjuntoCantidad,
                Adjuntos = (personalExterno.Adjuntos ?? new List<PersonalExternoAdjuntoDTO>()).Select(adjunto => new
                {
                    adjunto.CodPersonalExternoAdjunto,
                    adjunto.CodPersonalExterno,
                    adjunto.NombreArchivo,
                    adjunto.TipoContenido,
                    adjunto.TamanoBytes,
                    adjunto.RutaArchivo
                })
            };
        }
    }
}
