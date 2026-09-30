using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;


namespace app.Models.TipoUsuarios
{
    /// <summary>
    /// 
    /// </summary>
    internal class TipoUsuarioDAO
    {
        private TipoUsuarioDTO Obj = new TipoUsuarioDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal PaginacionResultado<TipoUsuarioDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<TipoUsuarioDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapTipoUsuario(reader);
            });

            return new PaginacionResultado<TipoUsuarioDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }
        //Listado para ComboBox
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodTipoUsuario"].ToString()
            });
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="CodTipoUsuario"></param>
        /// <returns></returns>
        internal TipoUsuarioDTO Obtener(int CodTipoUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodTipoUsuario), MapTipoUsuario).FirstOrDefault() ?? new TipoUsuarioDTO();
        }
        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }
        internal MsjDB Agregar(TipoUsuarioDTO Obj)
        {
            Obj.CodTipoUsuario = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoUsuario", "CREADO", "CodTipoUsuario:" + Obj.CodTipoUsuario, Nuevo: Obj);
            }

            return MsjDB;
        }
        internal MsjDB Editar(TipoUsuarioDTO Obj)
        {
            TipoUsuarioDTO ObjAnterior = Obtener(Obj.CodTipoUsuario);
            Obj.Version = ObtenerVersion(Obj.CodTipoUsuario);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoUsuario", "EDITADO", "CodTipoUsuario:" + Obj.CodTipoUsuario, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }
        internal MsjDB Eliminar(TipoUsuarioDTO Obj)
        {
            TipoUsuarioDTO ObjAnterior = Obtener(Obj.CodTipoUsuario);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("TipoUsuario", "CodTipoUsuario", Obj.CodTipoUsuario);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoUsuario", "ELIMINADO", "CodTipoUsuario:" + Obj.CodTipoUsuario, Anterior: ObjAnterior);
            }

            return MsjDB;
        }
        internal bool VerificarDescripcion(TipoUsuarioDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }
        internal int ObtenerVersion(int CodTipoUsuario)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodTipoUsuario), 1);
        }
        internal List<TipoUsuarioDTO> Log(int CodTipoUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodTipoUsuario), MapTipoUsuarioLog);
        }
        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, TipoUsuarioDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO TipoUsuario (CodTipoUsuario,Descripcion,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj.CodTipoUsuario + "','"
                            + Obj.Descripcion + "','"
                            + Obj.Version + "','"
                            + Obj.CodUsuarioCreacion + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE TipoUsuario SET "
                            + "Descripcion='" + Obj.Descripcion + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodTipoUsuario='" + Obj.CodTipoUsuario + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM TipoUsuario WHERE CodTipoUsuario='" + Obj.CodTipoUsuario + "'";
                case TipoDAL.Listado:
                    return "SELECT A.[CodTipoUsuario],A.[Descripcion] FROM TipoUsuario A ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodTipoUsuario],A.[Descripcion] FROM TipoUsuario A ";
                case TipoDAL.Obtener:
                    return "SELECT A.[CodTipoUsuario],A.[Descripcion] FROM TipoUsuario A " +
                           "WHERE A.[CodTipoUsuario]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodTipoUsuario]),0)+1 as 'CodTipoUsuario' FROM TipoUsuario A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM TipoUsuario A "
                        + "WHERE A.[Descripcion]='" + Obj.Descripcion + "' "
                        + "AND A.[CodTipoUsuario] <> '" + Obj.CodTipoUsuario + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM TipoUsuario A " +
                        "WHERE A.[CodTipoUsuario]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodTipoUsuario], A.[Descripcion],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                      + "FROM TipoUsuario A "
                      + "WHERE A.[CodTipoUsuario] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codTipoUsuario"] = "A.[CodTipoUsuario]",
                ["descripcion"] = "A.[Descripcion]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodTipoUsuario])",
                    "A.[Descripcion]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodTipoUsuario] ASC");

            return "SELECT A.[CodTipoUsuario],A.[Descripcion], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM TipoUsuario A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }
        private TipoUsuarioDTO MapTipoUsuario(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TipoUsuarioDTO Obj = new TipoUsuarioDTO();
            Obj.CodTipoUsuario = Convert.ToInt32(reader["CodTipoUsuario"]);
            Obj.IdTipoUsuario = ObjEncriptacion.Encriptar(Obj.CodTipoUsuario.ToString());
            Obj.Descripcion = reader["Descripcion"].ToString();
            return Obj;
        }

        private TipoUsuarioDTO MapTipoUsuarioLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TipoUsuarioDTO Obj = MapTipoUsuario(reader);
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



