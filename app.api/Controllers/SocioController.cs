using Microsoft.AspNetCore.Mvc;
using app.Messages;
using app.Models.Suplidor;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuplidorController : ControllerBase
    {
        private readonly SuplidorDAO SuplidorDAO = new SuplidorDAO();
        private readonly Encriptacion Encriptacion = new Encriptacion();
        private readonly VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Listar)]
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

                var pagina = SuplidorDAO.Listado(page, pageSize, search, sort, ObjVerificarUsuario.SesionUsuario());
                return Ok(pagina.Map(MapSuplidor));
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

                var lst = SuplidorDAO.Listar(ObjVerificarUsuario.SesionUsuario());
                return Ok(lst.Select(item => new { item.Value, item.Text }));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Visualizar)]
        [HttpGet("Obtener")]
        public IActionResult Obtener([FromQuery] string idsuplidor = "", [FromQuery] string idsocio = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodSuplidor = ObtenerCodSuplidor(idsuplidor, idsocio);
                SuplidorDTO Suplidor = SuplidorDAO.Obtener(CodSuplidor, ObjVerificarUsuario.SesionUsuario());

                if (string.IsNullOrWhiteSpace(Suplidor.CodSuplidor))
                {
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                }

                return Ok(MapSuplidor(Suplidor));
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Agregar)]
        [HttpPost("Agregar")]
        public IActionResult Agregar([FromBody] SuplidorDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = SuplidorDAO.Agregar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Editar)]
        [HttpPost("Editar")]
        public IActionResult Editar([FromBody] SuplidorDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = SuplidorDAO.Editar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Eliminar)]
        [HttpPost("Eliminar")]
        public IActionResult Eliminar([FromBody] SuplidorDTO Obj)
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                MsjDB MsjDB = SuplidorDAO.Eliminar(Obj);
                return Ok(MsjDB);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Log)]
        [HttpGet("Log")]
        public IActionResult Log([FromQuery] string idsuplidor = "", [FromQuery] string idsocio = "")
        {
            try
            {
                var sesion = ObjVerificarUsuario.ObtenerSesion();
                if (!sesion.Autenticado)
                {
                    return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
                }

                string CodSuplidor = ObtenerCodSuplidor(idsuplidor, idsocio);
                if (!new app.Models.UsuarioSuplidores.UsuarioSuplidorDAO().TieneAcceso(ObjVerificarUsuario.SesionUsuario(), CodSuplidor))
                    return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
                List<SuplidorDTO> lst = SuplidorDAO.Log(CodSuplidor);
                return Ok(lst);
            }
            catch (Exception)
            {
                throw;
            }
        }

        private string ObtenerCodSuplidor(string idsuplidor, string idsocio)
        {
            string id = !string.IsNullOrWhiteSpace(idsuplidor) ? idsuplidor : idsocio;
            string CodSuplidor = Encriptacion.Desencriptar(id);
            return CodSuplidor?.Trim() ?? "";
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Visualizar)]
        [HttpGet("ListarDistribucion")]
        public IActionResult ListarDistribucion([FromQuery] string idsuplidor)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            string codSuplidor = ObtenerCodSuplidor(idsuplidor, "");
            if (!new app.Models.UsuarioSuplidores.UsuarioSuplidorDAO().TieneAcceso(ObjVerificarUsuario.SesionUsuario(), codSuplidor)) return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
            return Ok(SuplidorDAO.ListarDistribucion(codSuplidor));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.Suplidor, Permisos.Editar)]
        [HttpPost("GuardarDistribucion")]
        public IActionResult GuardarDistribucion([FromQuery] string idsuplidor, [FromBody] List<SuplidorProductoDistribucionDTO> detalles)
        {
            var sesion = ObjVerificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            MsjDB respuesta = SuplidorDAO.GuardarDistribucion(ObtenerCodSuplidor(idsuplidor, ""), detalles);
            return respuesta.Estatus ? Ok(respuesta) : BadRequest(respuesta);
        }

        private object MapSuplidor(SuplidorDTO suplidor)
        {
            return new
            {
                suplidor.IdSuplidor,
                suplidor.CodSuplidor,
                suplidor.CodSocio,
                suplidor.IdSocio,
                suplidor.Socio,
                suplidor.Suplidor,
                suplidor.SuplidorNombreCorto,
                suplidor.Estatus
            };
        }
    }
}


