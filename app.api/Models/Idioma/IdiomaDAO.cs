using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Idioma
{
    /// <summary>
    /// Acceso a datos para el módulo de idiomas.
    /// </summary>
    internal class IdiomaDAO
    {
        private IdiomaDTO Obj = new IdiomaDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<IdiomaDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<IdiomaDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapIdioma(reader);
            });

            return new PaginacionResultado<IdiomaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["Idioma"].ToString(),
            });
        }

        internal IdiomaDTO Obtener(string Idioma)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: Idioma), MapIdioma).FirstOrDefault() ?? new IdiomaDTO();
        }

        internal MsjDB Agregar(IdiomaDTO Obj)
        {
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Idioma", "CREADO", "Idioma:" + Obj.Idioma, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(IdiomaDTO Obj)
        {
            IdiomaDTO ObjAnterior = Obtener(Obj.Idioma);
            Obj.Version = ObtenerVersion(Obj.Idioma);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Idioma", "EDITADO", "Idioma:" + Obj.Idioma, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(IdiomaDTO Obj)
        {
            IdiomaDTO ObjAnterior = Obtener(Obj.Idioma);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Idioma", "Idioma", Obj.Idioma);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Idioma", "ELIMINADO", "Idioma:" + Obj.Idioma, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarIdioma(IdiomaDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(string Idioma)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: Idioma), 1);
        }

        internal List<IdiomaDTO> Log(string Idioma)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: Idioma), MapIdiomaLog);
        }

        internal string Query(
            TipoDAL TipoDAL = TipoDAL.NoSeleccionado,
            string CodKey = "",
            IdiomaDTO Obj = null
        )
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Idioma (Idioma,Descripcion,Version,CodUsuarioCreacion,FechaCreacion)" +
                           "VALUES('"
                           + Obj.Idioma + "','"
                           + Obj.Descripcion + "','"
                           + Obj.Version + "','"
                           + Obj.CodUsuarioCreacion + "',"
                           + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Idioma SET "
                           + "Descripcion='" + Obj.Descripcion + "',"
                           + "Version=" + Obj.Version + ","
                           + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "',"
                           + "FechaActualizacion=GETDATE() "
                           + "WHERE Idioma='" + Obj.Idioma + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM Idioma WHERE Idioma='" + Obj.Idioma + "'";
                case TipoDAL.Listado:
                    return "SELECT A.[Idioma],A.[Descripcion] FROM Idioma A ";
                case TipoDAL.Listar:
                    return "SELECT A.[Idioma],A.[Descripcion] FROM Idioma A ";
                case TipoDAL.Obtener:
                    return "SELECT A.[Idioma],A.[Descripcion] FROM Idioma A WHERE A.[Idioma]='" + CodKey + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Idioma A "
                           + "WHERE A.[Idioma]='" + Obj.Idioma + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Idioma_LOG UNION ALL SELECT * FROM Idioma) A "
                           + "WHERE A.[Idioma]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[Idioma], A.[Descripcion],"
                           + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                           + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                           + "FROM (SELECT * FROM Idioma_LOG UNION ALL SELECT * FROM Idioma) A "
                           + "WHERE A.[Idioma] = '" + CodKey + "' "
                           + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["idioma"] = "A.[Idioma]",
                ["descripcion"] = "A.[Descripcion]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "A.[Idioma]",
                    "A.[Descripcion]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Idioma] ASC");

            return "SELECT A.[Idioma],A.[Descripcion], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Idioma A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private IdiomaDTO MapIdioma(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            IdiomaDTO Obj = new IdiomaDTO();
            Obj.Idioma = reader["Idioma"].ToString();
            Obj.IdIdioma = ObjEncriptacion.Encriptar(Obj.Idioma);
            Obj.Descripcion = reader["Descripcion"].ToString(); return Obj;
        }

        private IdiomaDTO MapIdiomaLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            IdiomaDTO Obj = MapIdioma(reader);
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




