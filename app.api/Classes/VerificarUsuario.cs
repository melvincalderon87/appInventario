
namespace app
{
    using Microsoft.AspNetCore.Http;

    public class VerificarUsuario
    {
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal string SesionUsuario()
        {
            string SesionUsuario = ObjEncriptacion.Desencriptar(Sesion.Obtener.Session.GetString("CodUsuario"));
            return SesionUsuario;
        }

        internal (bool Autenticado, string Idioma) ObtenerSesion()
        {
            string Idioma = Sesion.Obtener.Session.GetString("Idioma") ?? "es-GT";
            string? CodUsuarioSesion = Sesion.Obtener.Session.GetString("CodUsuario");

            if (CodUsuarioSesion == null)
            {
                return (false, Idioma);
            }

            string CodUsuario = ObjEncriptacion.Desencriptar(CodUsuarioSesion);
            return (!string.IsNullOrWhiteSpace(CodUsuario), Idioma);
        }
    }
}
