using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.TipoPermisos
{
    /// <summary>
    /// DAO para el catálogo de tipos de permiso.
    /// </summary>
    internal class TipoPermisoDAO
    {
        private DAL ObjDAL = new DAL();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<TipoPermisoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<TipoPermisoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapTipoPermiso(reader);
            });

            return new PaginacionResultado<TipoPermisoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodTipoPermiso"].ToString()
            });
        }

        internal TipoPermisoDTO Obtener(int CodTipoPermiso)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodTipoPermiso), MapTipoPermiso).FirstOrDefault() ?? new TipoPermisoDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(TipoPermisoDTO Obj)
        {
            Obj.CodTipoPermiso = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB msj = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msj.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoPermiso", "CREADO", "CodTipoPermiso:" + Obj.CodTipoPermiso, Nuevo: Obj);
            }

            return msj;
        }

        internal MsjDB Editar(TipoPermisoDTO Obj)
        {
            TipoPermisoDTO ObjAnterior = Obtener(Obj.CodTipoPermiso);
            Obj.Version = ObtenerVersion(Obj.CodTipoPermiso);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB msj = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msj.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoPermiso", "EDITADO", "CodTipoPermiso:" + Obj.CodTipoPermiso, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msj;
        }

        internal MsjDB Eliminar(TipoPermisoDTO Obj)
        {
            TipoPermisoDTO ObjAnterior = Obtener(Obj.CodTipoPermiso);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("TipoPermiso", "CodTipoPermiso", Obj.CodTipoPermiso);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB msj = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msj.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoPermiso", "ELIMINADO", "CodTipoPermiso:" + Obj.CodTipoPermiso, Anterior: ObjAnterior);
            }

            return msj;
        }

        internal bool VerificarDescripcion(TipoPermisoDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodTipoPermiso)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodTipoPermiso), 1);
        }

        internal List<TipoPermisoDTO> Log(int CodTipoPermiso)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodTipoPermiso), MapTipoPermisoLog);
        }

        internal string Query(
            TipoDAL TipoDAL = TipoDAL.NoSeleccionado,
            int CodKey = 0,
            TipoPermisoDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO TipoPermiso (CodTipoPermiso,Descripcion,Version,CodUsuarioCreacion,FechaCreacion)"
                           + "VALUES('"
                           + Obj.CodTipoPermiso + "','"
                           + Obj.Descripcion + "','"
                           + Obj.Version + "','"
                           + Obj.CodUsuarioCreacion + "',"
                           + "GETDATE())";

                case TipoDAL.Editar:
                    return "UPDATE TipoPermiso SET "
                           + "Descripcion='" + Obj.Descripcion + "',"
                           + "Version=" + Obj.Version + ","
                           + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "',"
                           + "FechaActualizacion=GETDATE() "
                           + "WHERE CodTipoPermiso='" + Obj.CodTipoPermiso + "'";

                case TipoDAL.Eliminar:
                    return "DELETE FROM TipoPermiso WHERE CodTipoPermiso='" + Obj.CodTipoPermiso + "'";

                case TipoDAL.Listado:
                    return "SELECT A.[CodTipoPermiso],A.[Descripcion] "
                           + "FROM TipoPermiso A "
                           + "ORDER BY A.[CodTipoPermiso]";

                case TipoDAL.Listar:
                    return "SELECT A.[CodTipoPermiso],A.[Descripcion] "
                           + "FROM TipoPermiso A "
                           + "ORDER BY A.[CodTipoPermiso]";

                case TipoDAL.Obtener:
                    return "SELECT A.[CodTipoPermiso],A.[Descripcion] "
                           + "FROM TipoPermiso A "
                           + "WHERE A.[CodTipoPermiso]='" + CodKey + "'";

                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodTipoPermiso]),0)+1 as 'CodTipoPermiso' FROM TipoPermiso A ";

                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM TipoPermiso A "
                           + "WHERE A.[Descripcion]='" + Obj.Descripcion + "' "
                           + "AND A.[CodTipoPermiso] <> '" + Obj.CodTipoPermiso + "'";

                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM TipoPermiso A "
                           + "WHERE A.[CodTipoPermiso]='" + CodKey + "'";

                case TipoDAL.Log:
                    return "SELECT A.[CodTipoPermiso],A.[Descripcion],"
                           + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                           + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                           + "FROM (SELECT * FROM TipoPermiso_LOG UNION ALL SELECT * FROM TipoPermiso) A "
                           + "WHERE A.[CodTipoPermiso] = '" + CodKey + "' "
                           + "ORDER BY A.Version ";

                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codTipoPermiso"] = "A.[CodTipoPermiso]",
                ["descripcion"] = "A.[Descripcion]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodTipoPermiso])",
                    "A.[Descripcion]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodTipoPermiso] ASC");

            return "SELECT A.[CodTipoPermiso],A.[Descripcion], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM TipoPermiso A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private TipoPermisoDTO MapTipoPermiso(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TipoPermisoDTO Obj = new TipoPermisoDTO();
            Obj.CodTipoPermiso = Convert.ToInt32(reader["CodTipoPermiso"]);
            Obj.IdTipoPermiso = ObjEncriptacion.Encriptar(Obj.CodTipoPermiso.ToString());
            Obj.Descripcion = reader["Descripcion"].ToString(); return Obj;
        }

        private TipoPermisoDTO MapTipoPermisoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TipoPermisoDTO Obj = MapTipoPermiso(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioCreacion))
            {
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion.ToString());
            }

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime fechaCreacion))
            {
                Obj.FechaCreacion = fechaCreacion;
            }

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();
            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioActualizacion))
            {
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion.ToString());
            }

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime fechaActualizacion))
            {
                Obj.FechaActualizacion = fechaActualizacion;
            }
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }
    }
}




