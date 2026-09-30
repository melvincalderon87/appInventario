using app.Messages;
using app.Models.Usuarios;
using app.Models.UsuarioSuplidores;
using Microsoft.AspNetCore.Mvc;

namespace app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioSuplidorController : ControllerBase
    {
        private readonly UsuarioSuplidorDAO dao = new UsuarioSuplidorDAO();
        private readonly Encriptacion encriptacion = new Encriptacion();
        private readonly VerificarUsuario verificarUsuario = new VerificarUsuario();

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Editar)]
        [HttpGet("Listar")]
        public IActionResult Listar([FromQuery] string idusuario)
        {
            var sesion = verificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            string usuario = Desencriptar(idusuario);
            if (string.IsNullOrWhiteSpace(usuario) || string.IsNullOrWhiteSpace(new UsuarioDAO().Obtener(usuario).CodUsuario))
                return NotFound(ManejadorErrores.Crear(TipoError.RegistroNoEncontrado));
            return Ok(dao.Listar(usuario));
        }

        [AuditoriaSistema]
        [RequierePermiso(Menus.UsuarioConfiguracion, Permisos.Editar)]
        [HttpPost("Guardar")]
        public IActionResult Guardar([FromBody] UsuarioSuplidorGuardarDTO obj)
        {
            var sesion = verificarUsuario.ObtenerSesion();
            if (!sesion.Autenticado) return Unauthorized(ManejadorErrores.NoAutorizado(sesion.Idioma));
            string usuario = Desencriptar(obj?.IdUsuario ?? "");
            if (string.IsNullOrWhiteSpace(usuario) || string.IsNullOrWhiteSpace(new UsuarioDAO().Obtener(usuario).CodUsuario))
                return BadRequest(ManejadorErrores.Validacion(TipoError.IdentificadorInvalido));
            return Ok(dao.Guardar(usuario, obj.CodSuplidores));
        }

        private string Desencriptar(string valor)
        {
            try { return encriptacion.Desencriptar(valor)?.Trim() ?? ""; }
            catch { return ""; }
        }
    }
}
