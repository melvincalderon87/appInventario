using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Metro;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetroController : ControllerBase
    {
        private readonly MetroDAO MetroDAO = new MetroDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Metro, Permisos.Listar)]
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

                var pagina = MetroDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapMetro));
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

                var lst = MetroDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Metro, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idmetro)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodMetro = ObtenerCodMetro(idmetro);
                MetroDTO Metro = MetroDAO.Obtener(CodMetro);

                if (string.IsNullOrWhiteSpace(Metro.CodMetro))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapMetro(Metro));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Metro, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] MetroDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = MetroDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Metro, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] MetroDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = MetroDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Metro, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] MetroDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = MetroDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Metro, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idmetro)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodMetro = ObtenerCodMetro(idmetro);
                List<MetroDTO> lst = MetroDAO.Log(CodMetro);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string ObtenerCodMetro(string idmetro)
        {
            string CodMetro = Encriptacion.Desencriptar(idmetro);
            return CodMetro.Trim();
        }

        private object MapMetro(MetroDTO metro)
        {
            return new
            {
                metro.IdMetro,
                metro.CodMetro,
                metro.CodBahia,
                metro.IdBahia,
                metro.Bahia,
                metro.CodBrazo,
                metro.IdBrazo,
                metro.Brazo,
                metro.CodProducto,
                metro.IdProducto,
                metro.Producto,
                metro.Metro,
                metro.TipoMetro,
                metro.Modelo,
                metro.Serie,
                metro.Comentario,
                metro.Estatus
            };
        }
    }
}
