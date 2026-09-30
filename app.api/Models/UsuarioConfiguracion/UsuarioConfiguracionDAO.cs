using app.Models.LogModificaciones;

using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using app.Models.Usuarios;
using app.Models.TipoUsuarios;
using app.Models.Roles;
using app.Models.Paginacion;


namespace app.Models.UsuarioConfiguraciones
{
    /// <summary>
    /// 
    /// </summary>
    internal class UsuarioConfiguracionDAO
    {
        private UsuarioConfiguracionDTO Obj = new UsuarioConfiguracionDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();
        internal UsuarioConfiguracionDTO Obtener(string CodUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL: TipoDAL.Obtener, CodKey: CodUsuario), MapUsuarioConfiguracion).FirstOrDefault() ?? new UsuarioConfiguracionDTO();
        }
        internal PaginacionResultado<UsuarioConfiguracionDTO> Listado(
            string CodUsuario,
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<UsuarioConfiguracionDTO> items = ObjDAL.EjecutarReader(QueryListado(CodUsuario, paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapUsuarioConfiguracion(reader);
            });

            return new PaginacionResultado<UsuarioConfiguracionDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }
        internal MsjDB Agregar(UsuarioConfiguracionDTO Obj)
        {
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("UsuarioConfiguracion", "CREADO", "CodUsuario:" + Obj.CodUsuario, Nuevo: Obj);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal MsjDB Editar(UsuarioConfiguracionDTO Obj)
        {
            UsuarioConfiguracionDTO ObjAnterior = Obtener(Obj.CodUsuario);
            Obj.Version = ObtenerVersion(Obj.CodUsuario);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("UsuarioConfiguracion", "EDITADO", "CodUsuario:" + Obj.CodUsuario, Anterior: ObjAnterior, Nuevo: Obj);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal MsjDB Eliminar(UsuarioConfiguracionDTO Obj)
        {
            UsuarioConfiguracionDTO ObjAnterior = Obtener(Obj.CodUsuario);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("UsuarioConfiguracion", "ELIMINADO", "CodUsuario:" + Obj.CodUsuario, Anterior: ObjAnterior);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal int ObtenerVersion(string CodUsuario)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodUsuario), 1);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal List<UsuarioConfiguracionDTO> Log(string CodUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodUsuario), MapUsuarioConfiguracionLog);
        }
        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", string Password = "",
        UsuarioConfiguracionDTO Obj = null, int Version = 0, string CodUsuarioActualizacion = "")
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:

                    return "INSERT INTO UsuarioConfiguracion (CodUsuario,CodTipoUsuario,CodRol,Version,CodUsuarioCreacion,FechaCreacion) Values('"
                        + Obj.CodUsuario + "','"
                        + Obj.CodTipoUsuario + "','"
                        + Obj.CodRol + "','"
                        + Obj.Version + "','"
                        + Obj.CodUsuarioCreacion + "',"
                        + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE UsuarioConfiguracion SET "
                        + "CodTipoUsuario='" + Obj.CodTipoUsuario + "',"
                        + "CodRol='" + Obj.CodRol + "',"
                        + "Version=" + Obj.Version + ","
                        + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "',"
                        + "FechaActualizacion=GETDATE() "
                        + "WHERE CodUsuario=lower('" + Obj.CodUsuario + "')";
                case TipoDAL.Eliminar:
                    return "DELETE FROM UsuarioConfiguracion "
                        + "WHERE CodUsuario=lower('" + Obj.CodUsuario + "')";
                case TipoDAL.Listado:
                    return "SELECT CodUsuario,Isnull(CodTipoUsuario,0) as CodTipoUsuario,Isnull(CodRol,0) as CodRol "
                        + "FROM UsuarioConfiguracion  "
                        + "Where CodUsuario='" + CodKey + "'";
                case TipoDAL.Obtener:
                    return "SELECT CodUsuario,ISNULL(CodTipoUsuario,0) as CodTipoUsuario,Isnull(CodRol,0) as CodRol "
                        + "FROM UsuarioConfiguracion "
                        + "WHERE Codusuario=lower('" + CodKey + "')";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM UsuarioConfiguracion_LOG UNION ALL SELECT * FROM UsuarioConfiguracion) A " +
                        "WHERE A.[Codusuario]=lower('" + CodKey + "')";
                case TipoDAL.Log:
                    return "SELECT "
                        + "CodUsuario,ISNULL(CodTipoUsuario,0) as CodTipoUsuario,Isnull(CodRol,0) as CodRol, "
                        + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                        + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                        + "FROM (SELECT * FROM UsuarioConfiguracion_LOG UNION ALL SELECT * FROM UsuarioConfiguracion) A "
                        + "WHERE Codusuario=lower('" + CodKey + "') "
                        + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string QueryListado(string CodUsuario, PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codUsuario"] = "A.[CodUsuario]",
                ["codTipoUsuario"] = "A.[CodTipoUsuario]",
                ["codRol"] = "A.[CodRol]"
            };
            string where = "WHERE A.[CodUsuario] = lower('" + PaginacionSql.SqlTexto(CodUsuario) + "') "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "A.[CodUsuario]",
                    "CONVERT(VARCHAR(20), A.[CodTipoUsuario])",
                    "CONVERT(VARCHAR(20), A.[CodRol])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodUsuario] ASC");

            return "SELECT A.[CodUsuario],ISNULL(A.[CodTipoUsuario],0) AS CodTipoUsuario,ISNULL(A.[CodRol],0) AS CodRol, "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM UsuarioConfiguracion A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }
        private UsuarioConfiguracionDTO MapUsuarioConfiguracion(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            UsuarioDAO ObjUsuario = new UsuarioDAO();
            TipoUsuarioDAO ObjTipoUsuario = new TipoUsuarioDAO();
            RolDAO ObjRol = new RolDAO();
            UsuarioConfiguracionDTO Obj = new UsuarioConfiguracionDTO();
            Obj.CodUsuario = reader["CodUsuario"].ToString();
            Obj.IdUsuario = ObjEncriptacion.Encriptar(Obj.CodUsuario.ToString());
            Obj.Usuario = ObjUsuario.Obtener(Obj.CodUsuario);
            Obj.CodTipoUsuario = Convert.ToInt32(reader["CodTipoUsuario"].ToString());
            Obj.TipoUsuario = ObjTipoUsuario.Obtener(Obj.CodTipoUsuario);
            Obj.CodRol = Convert.ToInt32(reader["CodRol"].ToString());
            Obj.Rol = ObjRol.Obtener(Obj.CodRol);
            return Obj;
        }

        private UsuarioConfiguracionDTO MapUsuarioConfiguracionLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            UsuarioConfiguracionDTO Obj = MapUsuarioConfiguracion(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion.ToString());

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime FechaCreacion))
                Obj.FechaCreacion = FechaCreacion;

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion.ToString());

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime FechaActualizacion))
                Obj.FechaActualizacion = FechaActualizacion;
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

    }
}




