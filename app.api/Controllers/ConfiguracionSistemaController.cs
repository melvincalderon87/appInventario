using app.Messages;
using app.Models.ConfiguracionSistema;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfiguracionSistemaController : ControllerBase
    {
        private readonly ConfiguracionSistemaDAO DAO = new ConfiguracionSistemaDAO();
        private readonly VerificarUsuario Sesion = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionSistema, Permisos.Listar)]
        [HttpGet("Listar")]
        public IActionResult Listar()
        {
            if (!Sesion.ObtenerSesion().Autenticado) return Unauthorized();
            try { return Ok(DAO.Obtener()); }
            catch { return StatusCode(500, ManejadorErrores.Crear(TipoError.ServidorInterno)); }
        }

        [AuditoriaSistema]
        [HttpGet("FondoInfo")]
        public IActionResult FondoInfo()
        {
            try
            {
                ConfiguracionSistemaFondoDTO fondo = DAO.Obtener().Fondo;
                return Ok(new { tieneFondo = !string.IsNullOrWhiteSpace(fondo.FondoRutaArchivo), version = fondo.FechaActualizacion?.Ticks ?? fondo.FechaCreacion?.Ticks ?? fondo.Version });
            }
            catch { return Ok(new { tieneFondo = false, version = 0 }); }
        }

        [AuditoriaSistema]
        [HttpGet("EmpresaInfo")]
        public IActionResult EmpresaInfo()
        {
            try
            {
                ConfiguracionSistemaEmpresaDTO empresa = DAO.Obtener().Empresa;
                return Ok(new
                {
                    empresa.NombreComercial,
                    empresa.NombreFiscal,
                    empresa.Nit,
                    empresa.Direccion,
                    empresa.Telefono,
                    empresa.PaginaWeb,
                    empresa.Version
                });
            }
            catch
            {
                return Ok(new { NombreComercial = "", NombreFiscal = "", Nit = "", Direccion = "", Telefono = "", PaginaWeb = "", Version = 0 });
            }
        }

        [AuditoriaSistema]
        [HttpGet("Fondo")]
        public IActionResult Fondo()
        {
            try { byte[] contenido = DAO.LeerFondo(out string tipo); return contenido.Length == 0 ? NotFound() : File(contenido, tipo, "fondo"); }
            catch { return NotFound(); }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionSistema, Permisos.Listar)]
        [HttpGet("Logo")]
        public IActionResult Logo()
        {
            if (!Sesion.ObtenerSesion().Autenticado) return Unauthorized();
            try { byte[] contenido = DAO.LeerLogo(out string tipo); return contenido.Length == 0 ? NotFound() : File(contenido, tipo, "logo"); }
            catch { return NotFound(); }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionSistema, Permisos.Editar)]
        [HttpPost("GuardarEmpresa")]
        public IActionResult GuardarEmpresa([FromBody] ConfiguracionSistemaEmpresaDTO obj)
        {
            if (!Sesion.ObtenerSesion().Autenticado) return Unauthorized();
            try { return Ok(DAO.GuardarEmpresa(obj ?? new ConfiguracionSistemaEmpresaDTO())); }
            catch { return StatusCode(500, ManejadorErrores.Crear(TipoError.ServidorInterno)); }
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.ConfiguracionSistema, Permisos.Editar)]
        [HttpPost("GuardarFondo")]
        public IActionResult GuardarFondo([FromBody] ConfiguracionSistemaFondoDTO obj)
        {
            if (!Sesion.ObtenerSesion().Autenticado) return Unauthorized();
            try { return Ok(DAO.GuardarFondo(obj ?? new ConfiguracionSistemaFondoDTO())); }
            catch { return StatusCode(500, ManejadorErrores.Crear(TipoError.ServidorInterno)); }
        }
    }
}
