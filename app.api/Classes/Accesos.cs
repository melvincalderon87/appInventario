
using app.Models.UsuarioConfiguraciones;
namespace app
{
    public class Accesos
    {
        private static string Query(int CodRol, int CodMenu, int CodTipoPermiso)
        {
            string sql = "SELECT 'TRUE' "
            + "FROM Permiso A "
            + "WHERE "
            + "A.[CodRol] = " + CodRol + " AND "
            + "A.[CodMenu] = " + CodMenu + " AND "
            + "A.[CodTipoPermiso] =" + CodTipoPermiso;
            return sql;
        }
        internal static bool Verificar(Menus CodMenu, Permisos CodTipoPermiso)
        {
            UsuarioConfiguracionDTO UsuarioConfiguracion = new UsuarioConfiguracionDTO();
            UsuarioConfiguracionDAO UsuarioConfiguracionDAO = new UsuarioConfiguracionDAO();
            Encriptacion ObjEncriptacion = new Encriptacion();
            int CodRol_ = 0;
            string CodUsuario = ObjEncriptacion.Desencriptar(Sesion.Obtener.Session.GetString("CodUsuario"));
            UsuarioConfiguracion = UsuarioConfiguracionDAO.Obtener(CodUsuario);
            CodRol_ = UsuarioConfiguracion.CodRol;
            DAL ObjDAL = new DAL();
            return ObjDAL.EjecutarExiste(Query(CodRol: CodRol_, CodMenu: (int)CodMenu, CodTipoPermiso: (int)CodTipoPermiso));
        }

    }
}
