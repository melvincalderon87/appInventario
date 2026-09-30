using app.Models.LogModificaciones;

using app.Models.Roles;
using app.Models.Idioma;
using app.Models.TipoUsuarios;
using app.Models.Usuarios;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
namespace app.Models.UsuarioPreferencias
{
    /// <summary>
    /// 
    /// </summary>
    internal class UsuarioPreferenciaDAO
    {
        private UsuarioPreferenciaDTO Obj = new UsuarioPreferenciaDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();
        internal UsuarioPreferenciaDTO Obtener(string CodUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL: TipoDAL.Obtener, CodKey: CodUsuario), MapUsuarioPreferencia).FirstOrDefault() ?? new UsuarioPreferenciaDTO();
        }
        internal PaginacionResultado<UsuarioPreferenciaDTO> Listado(
            string CodUsuario,
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<UsuarioPreferenciaDTO> items = ObjDAL.EjecutarReader(QueryListado(CodUsuario, paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapUsuarioPreferencia(reader);
            });

            return new PaginacionResultado<UsuarioPreferenciaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }
        internal MsjDB Agregar(UsuarioPreferenciaDTO Obj)
        {
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("UsuarioPreferencia", "CREADO", "CodUsuario:" + Obj.CodUsuario, Nuevo: Obj);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal MsjDB Editar(UsuarioPreferenciaDTO Obj)
        {
            UsuarioPreferenciaDTO ObjAnterior = Obtener(Obj.CodUsuario);
            Obj.Version = ObtenerVersion(Obj.CodUsuario);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("UsuarioPreferencia", "EDITADO", "CodUsuario:" + Obj.CodUsuario, Anterior: ObjAnterior, Nuevo: Obj);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal MsjDB Eliminar(UsuarioPreferenciaDTO Obj)
        {
            UsuarioPreferenciaDTO ObjAnterior = Obtener(Obj.CodUsuario);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("UsuarioPreferencia", "ELIMINADO", "CodUsuario:" + Obj.CodUsuario, Anterior: ObjAnterior);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal List<SelectListItem> ListarIdioma()
        {
            return new IdiomaDAO().Listar();
        }
        internal int ObtenerVersion(string CodUsuario)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodUsuario), 1);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal List<UsuarioPreferenciaDTO> Log(string CodUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodUsuario), MapUsuarioPreferenciaLog);
        }
        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", UsuarioPreferenciaDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO UsuarioPreferencia (CodUsuario,Idioma,Theme,Version,CodUsuarioCreacion,FechaCreacion) "
                        + "Values('"
                        + Obj.CodUsuario + "','"
                        + Obj.Idioma + "','"
                        + Obj.Theme + "','"
                        + Obj.Version + "','"
                        + Obj.CodUsuarioCreacion + "',"
                        + "GETDATE() "
                        + ")";
                case TipoDAL.Editar:
                    return "UPDATE UsuarioPreferencia SET "
                        + "Idioma='" + Obj.Idioma + "',"
                        + "Theme='" + Obj.Theme + "',"
                        + "Version=" + Obj.Version + ","
                        + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "',"
                        + "FechaActualizacion=GETDATE() "
                        + "WHERE CodUsuario=lower('" + Obj.CodUsuario + "')";
                case TipoDAL.Eliminar:
                    return "DELETE FROM UsuarioPreferencia "
                        + "WHERE CodUsuario=lower('" + Obj.CodUsuario + "')";
                case TipoDAL.Listado:
                    return "SELECT CodUsuario,Isnull(Idioma,'') as Idioma,ISNULL(Theme,'bluedark') as Theme "
                    + "FROM UsuarioPreferencia  "
                    + "Where CodUsuario='" + CodKey + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM UsuarioPreferencia_LOG UNION ALL SELECT * FROM UsuarioPreferencia) A " +
                        "WHERE A.[CodUsuario]='" + CodKey + "'";
                case TipoDAL.Obtener:
                    return "SELECT CodUsuario,ISNULL(Idioma,'') as Idioma,ISNULL(Theme,'bluedark') as Theme "
                        + "FROM UsuarioPreferencia "
                        + "WHERE Codusuario=lower('" + CodKey + "')";
                case TipoDAL.Log:
                    return "SELECT "
                        + "CodUsuario,ISNULL(Idioma,'') as Idioma,ISNULL(Theme,'bluedark') as Theme, "
                        + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                        + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                        + "FROM (SELECT * FROM UsuarioPreferencia_LOG UNION ALL SELECT * FROM UsuarioPreferencia) A "
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
                ["idioma"] = "A.[Idioma]",
                ["theme"] = "A.[Theme]"
            };
            string where = "WHERE A.[CodUsuario] = lower('" + PaginacionSql.SqlTexto(CodUsuario) + "') "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "A.[CodUsuario]",
                    "A.[Idioma]",
                    "A.[Theme]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodUsuario] ASC");

            return "SELECT A.[CodUsuario],ISNULL(A.[Idioma],'') AS Idioma,ISNULL(A.[Theme],'bluedark') AS Theme, "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM UsuarioPreferencia A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }
        private UsuarioPreferenciaDTO MapUsuarioPreferencia(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            UsuarioDAO ObjUsuario = new UsuarioDAO();
            UsuarioPreferenciaDTO Obj = new UsuarioPreferenciaDTO();
            Obj.CodUsuario = reader["CodUsuario"].ToString();
            Obj.IdUsuario = ObjEncriptacion.Encriptar(Obj.CodUsuario.ToString());
            Obj.Usuario = ObjUsuario.Obtener(Obj.CodUsuario);
            Obj.Idioma = reader["Idioma"].ToString();
            Obj.Theme = reader["Theme"].ToString();
            return Obj;
        }

        private UsuarioPreferenciaDTO MapUsuarioPreferenciaLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            UsuarioPreferenciaDTO Obj = MapUsuarioPreferencia(reader);
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





