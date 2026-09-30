using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.TipoProducto;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TipoProductoController : ControllerBase
    {
        private readonly TipoProductoDAO TipoProductoDAO = new TipoProductoDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoProducto, Permisos.Listar)]
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

                var pagina = TipoProductoDAO.Listado(page, pageSize, search, sort);
                return Ok(pagina.Map(MapTipoProducto));
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

                var lst = TipoProductoDAO.Listar();
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoProducto, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idtipoproducto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTipoProducto = ObtenerCodTipoProducto(idtipoproducto);
                TipoProductoDTO TipoProducto = TipoProductoDAO.Obtener(CodTipoProducto);

                if (string.IsNullOrWhiteSpace(TipoProducto.CodTipoProducto))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapTipoProducto(TipoProducto));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoProducto, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] TipoProductoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TipoProductoDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoProducto, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] TipoProductoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TipoProductoDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoProducto, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] TipoProductoDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = TipoProductoDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.TipoProducto, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idtipoproducto)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodTipoProducto = ObtenerCodTipoProducto(idtipoproducto);
                List<TipoProductoDTO> lst = TipoProductoDAO.Log(CodTipoProducto);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string ObtenerCodTipoProducto(string idtipoproducto)
        {
            string CodTipoProducto = Encriptacion.Desencriptar(idtipoproducto);
            return CodTipoProducto.Trim();
        }

        private object MapTipoProducto(TipoProductoDTO tipoProducto)
        {
            return new
            {
                tipoProducto.IdTipoProducto,
                tipoProducto.CodTipoProducto,
                tipoProducto.Descripcion,
                tipoProducto.DescripcionCorta
            };
        }
    }
}




