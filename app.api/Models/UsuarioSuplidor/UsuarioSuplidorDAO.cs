using app.Models.LogModificaciones;
using app.Models.Suplidor;

namespace app.Models.UsuarioSuplidores
{
    /// <summary>Acceso a datos del modulo UsuarioSuplidor.</summary>
    internal class UsuarioSuplidorDAO
    {
        private readonly DAL dal = new DAL();
        private readonly Encriptacion encriptacion = new Encriptacion();

        internal List<UsuarioSuplidorDTO> Listar(string codUsuario)
        {
            string usuario = Sql(codUsuario);
            return dal.EjecutarReader(
                "SELECT S.CodSuplidor,S.Suplidor,CASE WHEN US.CodSuplidor IS NULL THEN 0 ELSE 1 END AS Seleccionado "
                + "FROM Suplidor S LEFT JOIN UsuarioSuplidor US ON US.CodSuplidor=S.CodSuplidor AND US.CodUsuario=N'" + usuario + "' AND US.Estatus=1 "
                + "WHERE ISNULL(S.Estatus,1)=1 ORDER BY S.Suplidor", r => new UsuarioSuplidorDTO
                {
                    CodUsuario = codUsuario,
                    IdUsuario = encriptacion.Encriptar(codUsuario),
                    CodSuplidor = r["CodSuplidor"].ToString() ?? "",
                    IdSuplidor = encriptacion.Encriptar(r["CodSuplidor"].ToString() ?? ""),
                    Suplidor = r["Suplidor"].ToString() ?? "",
                    Seleccionado = Convert.ToBoolean(r["Seleccionado"])
                });
        }

        // Sin registros activos se conserva el acceso total, para no restringir usuarios existentes.
        internal bool TieneAcceso(string codUsuario, string codSuplidor)
        {
            string usuario = Sql(codUsuario);
            string suplidor = Sql(codSuplidor);
            return dal.EjecutarScalar(
                "SELECT CASE WHEN EXISTS (SELECT 1 FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "' AND Estatus=1) "
                + "THEN CASE WHEN EXISTS (SELECT 1 FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "' AND CodSuplidor='" + suplidor + "' AND Estatus=1) THEN 1 ELSE 0 END ELSE 1 END", 0) == 1;
        }

        internal List<string> SuplidoresPermitidos(string codUsuario)
        {
            return dal.EjecutarReader(
                "SELECT CodSuplidor FROM UsuarioSuplidor WHERE CodUsuario=N'" + Sql(codUsuario) + "' AND Estatus=1",
                r => r["CodSuplidor"].ToString() ?? "");
        }

        internal bool TieneRestriccion(string codUsuario)
        {
            return dal.EjecutarExiste("SELECT 1 FROM UsuarioSuplidor WHERE CodUsuario=N'" + Sql(codUsuario) + "' AND Estatus=1");
        }

        internal MsjDB Guardar(string codUsuario, IEnumerable<string>? codSuplidores)
        {
            List<string> suplidores = (codSuplidores ?? Enumerable.Empty<string>())
                .Select(x => (x ?? "").Trim()).Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            SuplidorDAO suplidorDao = new SuplidorDAO();
            if (suplidores.Any(codigo => string.IsNullOrWhiteSpace(suplidorDao.Obtener(codigo).CodSuplidor)))
                return new MsjDB { Estatus = false, Msj = "Uno de los suplidores seleccionados no existe." };

            string usuario = Sql(codUsuario);
            string usuarioSesion = Sql(new VerificarUsuario().SesionUsuario());
            string seleccion = string.Join(",", suplidores.Select(x => "'" + Sql(x) + "'"));
            string excluir = suplidores.Count > 0 ? " AND CodSuplidor NOT IN (" + seleccion + ")" : "";

            MsjDB resultado = dal.Ejecutar(
                "INSERT INTO UsuarioSuplidor_LOG (CodUsuario,CodSuplidor,Version,Estatus,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodUsuario,CodSuplidor,Version,0,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,N'" + usuarioSesion + "',GETDATE(),'D' FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "' AND Estatus=1" + excluir + "; "
                + "DELETE FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "'" + excluir,
                Key: false, tipoDAL: TipoDAL.Eliminar);
            if (!resultado.Estatus) return resultado;

            foreach (string suplidor in suplidores)
            {
                string codigo = Sql(suplidor);
                resultado = dal.Ejecutar(
                    "IF EXISTS (SELECT 1 FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "' AND CodSuplidor='" + codigo + "') "
                    + "BEGIN INSERT INTO UsuarioSuplidor_LOG (CodUsuario,CodSuplidor,Version,Estatus,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) SELECT CodUsuario,CodSuplidor,Version,Estatus,CodUsuarioCreacion,FechaCreacion,N'" + usuarioSesion + "',GETDATE(),CodUsuarioEliminacion,FechaEliminacion,'U' FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "' AND CodSuplidor='" + codigo + "' AND Estatus=0; "
                    + "UPDATE UsuarioSuplidor SET Estatus=1,Version=Version+1,CodUsuarioActualizacion=N'" + usuarioSesion + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodUsuario=N'" + usuario + "' AND CodSuplidor='" + codigo + "' AND Estatus=0; END "
                    + "ELSE INSERT INTO UsuarioSuplidor (CodUsuario,CodSuplidor,Version,Estatus,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES (N'" + usuario + "','" + codigo + "',1,1,N'" + usuarioSesion + "',GETDATE(),'C')",
                    Key: false, tipoDAL: TipoDAL.Editar);
                if (!resultado.Estatus) return resultado;
            }

            LogModificacionDAO.Registrar("UsuarioSuplidor", "EDITADO", "CodUsuario:" + codUsuario,
                "Asignacion de suplidores actualizada.");
            return new MsjDB { Estatus = true, Msj = "Accesos a suplidores guardados correctamente." };
        }

        internal MsjDB EliminarPorUsuario(string codUsuario)
        {
            string usuario = Sql(codUsuario);
            string usuarioSesion = Sql(new VerificarUsuario().SesionUsuario());
            return dal.Ejecutar(
                "INSERT INTO UsuarioSuplidor_LOG (CodUsuario,CodSuplidor,Version,Estatus,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodUsuario,CodSuplidor,Version,0,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,N'" + usuarioSesion + "',GETDATE(),'D' FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "'; "
                + "DELETE FROM UsuarioSuplidor WHERE CodUsuario=N'" + usuario + "'", Key: false, tipoDAL: TipoDAL.Eliminar);
        }

        private static string Sql(string? valor) => (valor ?? "").Replace("'", "''");
    }
}
