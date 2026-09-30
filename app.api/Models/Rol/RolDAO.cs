using app.Models.LogModificaciones;

using app.Models.Menu;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Roles
{
    /// <summary>
    /// 
    /// </summary>
    internal class RolDAO
    {
        private RolDTO Obj = new RolDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal PaginacionResultado<RolDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<RolDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapRol(reader);
            });

            return new PaginacionResultado<RolDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
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
                Value = reader["CodRol"].ToString()
            });
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="CodRol"></param>
        /// <returns></returns>
        internal RolDTO Obtener(int CodRol)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodRol), MapRol).FirstOrDefault() ?? new RolDTO();
        }
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="Obj"></param>        
        internal MsjDB Agregar(RolDTO Obj)
        {
            Obj.CodRol = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Rol", "CREADO", "CodRol:" + Obj.CodRol, Nuevo: Obj);
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
        /// <param name="Obj"></param>        
        /// <returns></returns>
        internal MsjDB Editar(RolDTO Obj)
        {
            RolDTO ObjAnterior = Obtener(Obj.CodRol);
            Obj.Version = ObtenerVersion(Obj.CodRol);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Rol", "EDITADO", "CodRol:" + Obj.CodRol, Anterior: ObjAnterior, Nuevo: Obj);
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
        /// <param name="Obj"></param>        
        /// <returns></returns>
        internal MsjDB Eliminar(RolDTO Obj)
        {
            RolDTO ObjAnterior = Obtener(Obj.CodRol);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Rol", "CodRol", Obj.CodRol);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Rol", "ELIMINADO", "CodRol:" + Obj.CodRol, Anterior: ObjAnterior);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }

        }
        /// <summary>
        /// Verificar Descripcion
        /// </summary>
        /// <param name="Obj"></param>        
        /// <returns></returns>
        internal bool VerificarDescripcion(RolDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }
        internal int ObtenerVersion(int CodRol)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodRol), 1);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal List<RolDTO> Log(int CodRol)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodRol), MapRolLog);
        }
        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, RolDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Rol (CodRol,Descripcion,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj.CodRol + "','"
                            + Obj.Descripcion + "','"
                            + Obj.Version + "','"
                            + Obj.CodUsuarioCreacion + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Rol SET "
                            + "Descripcion='" + Obj.Descripcion + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodRol='" + Obj.CodRol + "'";

                case TipoDAL.Eliminar:
                    return "DELETE FROM Rol WHERE CodRol='" + Obj.CodRol + "'";
                case TipoDAL.Listado:
                    return "SELECT A.[CodRol],A.[Descripcion] FROM Rol A ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodRol],A.[Descripcion] FROM Rol A ";
                case TipoDAL.Obtener:
                    return "SELECT A.[CodRol],A.[Descripcion] FROM Rol A " +
                           "WHERE A.[CodRol]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodRol]),0)+1 as 'CodRol' FROM Rol A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Rol A "
                        + "WHERE A.[Descripcion]='" + Obj.Descripcion + "' "
                        + "AND A.[CodRol] <> '" + Obj.CodRol + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Rol_LOG UNION ALL SELECT * FROM Rol) A " +
                        "WHERE A.[CodRol]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodRol], A.[Descripcion],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                      + "FROM (SELECT * FROM Rol_LOG UNION ALL SELECT * FROM Rol) A "
                      + "WHERE A.[CodRol] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codRol"] = "A.[CodRol]",
                ["descripcion"] = "A.[Descripcion]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodRol])",
                    "A.[Descripcion]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodRol] ASC");

            return "SELECT A.[CodRol],A.[Descripcion], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Rol A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }
        private RolDTO MapRol(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            RolDTO Obj = new RolDTO();
            Obj.CodRol = Convert.ToInt32(reader["CodRol"]);
            Obj.IdRol = ObjEncriptacion.Encriptar(Obj.CodRol.ToString());
            Obj.Descripcion = reader["Descripcion"].ToString();
            return Obj;
        }

        private RolDTO MapRolLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            RolDTO Obj = MapRol(reader);
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




