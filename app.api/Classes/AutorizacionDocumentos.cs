namespace app
{
    internal static class AutorizacionDocumentos
    {
        internal static void RegistrarPendiente(int menu, int documento)
        {
            if (!HayAutorizador(menu)) return;
            string usuario = (new VerificarUsuario().SesionUsuario() ?? "").Replace("'", "''");
            new DAL().Ejecutar("IF EXISTS (SELECT 1 FROM AutorizacionDocumento WHERE CodMenu=" + menu + " AND CodDocumento=N'" + documento + "') UPDATE AutorizacionDocumento SET Estado=N'Pendiente',Estatus=1,Version=Version+1,CodUsuarioActualizacion=N'" + usuario + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodMenu=" + menu + " AND CodDocumento=N'" + documento + "' ELSE INSERT INTO AutorizacionDocumento (CodMenu,CodDocumento,Estado,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES (" + menu + ",N'" + documento + "',N'Pendiente',1,1,N'" + usuario + "',GETDATE(),'C')", Key: false, tipoDAL: TipoDAL.Agregar);
        }

        internal static bool EstaPendiente(int menu, int documento) => new DAL().EjecutarExiste("SELECT 1 FROM AutorizacionDocumento WHERE CodMenu=" + menu + " AND CodDocumento=N'" + documento + "' AND Estado=N'Pendiente' AND Estatus=1");

        internal static bool HayAutorizador(int menu) => new DAL().EjecutarExiste("SELECT 1 FROM AutorizadorDocumentos WHERE CodMenu=" + menu + " AND Estatus=1");
    }
}
