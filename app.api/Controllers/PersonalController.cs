using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Personal;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonalController : ControllerBase
    {
        private readonly PersonalDAO PersonalDAO = new PersonalDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Personal, Permisos.Listar)]
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

                var pagina = PersonalDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapPersonal));
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

                var lst = PersonalDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [HttpGet("ListarTecnicoOpcion")]
        public IActionResult ListarTecnicoOpcion()
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                var lst = PersonalDAO.ListarTecnicos();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Personal, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idpersonal)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodPersonal = ObtenerCodPersonal(idpersonal);
                PersonalDTO Personal = PersonalDAO.Obtener(CodPersonal);

                if (Personal.CodPersonal <= 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapPersonal(Personal));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Personal, Permisos.Visualizar)]
        [HttpGet("Foto")]
        public IActionResult Foto([FromQuery] string idpersonal)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodPersonal = ObtenerCodPersonal(idpersonal);
                PersonalDTO Personal = PersonalDAO.Obtener(CodPersonal);

                if (Personal.CodPersonal <= 0 || string.IsNullOrWhiteSpace(Personal.FotoRutaArchivo))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                byte[] contenido = PersonalDAO.LeerFoto(Personal);
                if (contenido.Length == 0)
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return File(contenido, Personal.FotoTipoContenido, Personal.FotoNombreArchivo);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Personal, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] PersonalDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = PersonalDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Personal, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] PersonalDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = PersonalDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Personal, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] PersonalDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = PersonalDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Personal, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idpersonal)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                int CodPersonal = ObtenerCodPersonal(idpersonal);
                List<PersonalDTO> lst = PersonalDAO.Log(CodPersonal);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private int ObtenerCodPersonal(string idpersonal)
        {
            string CodPersonal = Encriptacion.Desencriptar(idpersonal);
            return int.TryParse(CodPersonal, out int valor) ? valor : 0;
        }

        private object MapPersonal(PersonalDTO personal)
        {
            return new
            {
                personal.IdPersonal,
                personal.CodPersonal,
                personal.CodTecnico,
                personal.Nombre,
                personal.Puesto,
                personal.EsTecnico,
                personal.FotoNombreArchivo,
                personal.FotoTipoContenido,
                personal.FotoTamanoBytes,
                personal.FotoRutaArchivo,
                personal.Estatus
            };
        }
    }
}
