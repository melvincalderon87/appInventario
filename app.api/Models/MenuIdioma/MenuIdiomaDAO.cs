using app.Models.LogModificaciones;
using app.Models.Paginacion;
using System;
using System.Collections.Generic;

namespace app.Models.MenuIdioma
{
    /// <summary>Acceso a datos del modulo MenuIdioma.</summary>
    internal class MenuIdiomaDAO
    {
        private readonly DAL ObjDAL = new DAL();
        private readonly MsjDB MsjDB = new MsjDB();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<MenuIdiomaDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<MenuIdiomaDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapMenuIdioma(reader);
            });

            return new PaginacionResultado<MenuIdiomaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal MenuIdiomaDTO Obtener(int CodMenu, string Idioma)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodMenu, CodKeyAux: Idioma), MapMenuIdioma)
                .FirstOrDefault() ?? new MenuIdiomaDTO();
        }

        internal MsjDB Agregar(MenuIdiomaDTO Obj)
        {
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB msj = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msj.Estatus == true)
            {
                LogModificacionDAO.Registrar("MenuIdioma", "CREADO", ObtenerLlave(Obj), Nuevo: Obj);
            }

            return msj;
        }

        internal MsjDB Editar(MenuIdiomaDTO Obj)
        {
            MenuIdiomaDTO ObjAnterior = Obtener(Obj.CodMenu, Obj.Idioma);
            Obj.Version = ObtenerVersion(Obj.CodMenu, Obj.Idioma);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB msj = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msj.Estatus == true)
            {
                LogModificacionDAO.Registrar("MenuIdioma", "EDITADO", ObtenerLlave(Obj), Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msj;
        }

        internal MsjDB Eliminar(MenuIdiomaDTO Obj)
        {
            MenuIdiomaDTO ObjAnterior = Obtener(Obj.CodMenu, Obj.Idioma);
            MsjDB msj = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msj.Estatus == true)
            {
                LogModificacionDAO.Registrar("MenuIdioma", "ELIMINADO", ObtenerLlave(Obj), Anterior: ObjAnterior);
            }

            return msj;
        }

        internal bool VerificarDuplicado(MenuIdiomaDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodMenu, string Idioma)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodMenu, CodKeyAux: Idioma), 1);
        }

        internal List<MenuIdiomaDTO> Log(int CodMenu, string Idioma)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodMenu, CodKeyAux: Idioma), MapMenuIdiomaLog);
        }

        internal string Query(
            TipoDAL TipoDAL = TipoDAL.NoSeleccionado,
            int CodKey = 0,
            string CodKeyAux = "",
            MenuIdiomaDTO Obj = null
        )
        {
            string codMenu = CodKey.ToString();

            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO MenuIdioma (CodMenu,Idioma,Descripcion,Version,CodUsuarioCreacion,FechaCreacion) "
                           + "VALUES("
                           + Obj.CodMenu + ", '"
                           + Obj.Idioma + "','"
                           + Obj.Descripcion + "','"
                           + Obj.Version + "','"
                           + Obj.CodUsuarioCreacion + "',"
                           + "GETDATE())";

                case TipoDAL.Editar:
                    return "UPDATE MenuIdioma SET "
                           + "Descripcion='" + Obj.Descripcion + "', "
                           + "Version=" + Obj.Version + ", "
                           + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "', "
                           + "FechaActualizacion=GETDATE() "
                           + "WHERE CodMenu=" + Obj.CodMenu + " "
                           + "AND Idioma='" + Obj.Idioma + "'";

                case TipoDAL.Eliminar:
                    return "DELETE FROM MenuIdioma "
                           + "WHERE CodMenu=" + Obj.CodMenu + " "
                           + "AND Idioma='" + Obj.Idioma + "'";

                case TipoDAL.Listado:
                    return "SELECT A.[CodMenu], A.[Idioma], A.[Descripcion] "
                           + "FROM MenuIdioma A "
                           + "ORDER BY A.[CodMenu], A.[Idioma]";

                case TipoDAL.Obtener:
                    return "SELECT A.[CodMenu], A.[Idioma], A.[Descripcion] "
                           + "FROM MenuIdioma A "
                           + "WHERE A.[CodMenu]=" + codMenu + " "
                           + "AND A.[Idioma]='" + CodKeyAux + "'";

                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM MenuIdioma "
                           + "WHERE CodMenu=" + Obj.CodMenu + " "
                           + "AND Idioma='" + Obj.Idioma + "'";

                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 AS Version "
                           + "FROM (SELECT * FROM MenuIdioma_LOG UNION ALL SELECT * FROM MenuIdioma) A "
                           + "WHERE A.[CodMenu]=" + codMenu + " "
                           + "AND A.[Idioma]='" + CodKeyAux + "'";

                case TipoDAL.Log:
                    return "SELECT A.[CodMenu], A.[Idioma], A.[Descripcion], "
                           + "A.[Version], A.[CodUsuarioCreacion], A.[FechaCreacion], "
                           + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                           + "FROM (SELECT * FROM MenuIdioma_LOG UNION ALL SELECT * FROM MenuIdioma) A "
                           + "WHERE A.[CodMenu]=" + codMenu + " "
                           + "AND A.[Idioma]='" + CodKeyAux + "' "
                           + "ORDER BY A.[Version]";

                default:
                    return "";
            }
        }

        private MenuIdiomaDTO MapMenuIdioma(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            MenuIdiomaDTO Obj = new MenuIdiomaDTO();
            Obj.CodMenu = Convert.ToInt32(reader["CodMenu"]);
            Obj.Idioma = reader["Idioma"].ToString();
            Obj.Descripcion = reader["Descripcion"].ToString(); Obj.IdMenuIdioma = ObjEncriptacion.Encriptar($"{Obj.CodMenu}|{Obj.Idioma}");
            return Obj;
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codMenu"] = "A.[CodMenu]",
                ["idioma"] = "A.[Idioma]",
                ["descripcion"] = "A.[Descripcion]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodMenu])",
                    "A.[Idioma]",
                    "A.[Descripcion]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodMenu] ASC, A.[Idioma] ASC");

            return "SELECT A.[CodMenu], A.[Idioma], A.[Descripcion], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM MenuIdioma A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private MenuIdiomaDTO MapMenuIdiomaLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            MenuIdiomaDTO Obj = MapMenuIdioma(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion.ToString());

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime FechaCreacion))
            {
                Obj.FechaCreacion = FechaCreacion;
            }

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion.ToString());

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime FechaActualizacion))
            {
                Obj.FechaActualizacion = FechaActualizacion;
            }
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private string ObtenerLlave(MenuIdiomaDTO Obj)
        {
            return "CodMenu:" + Obj.CodMenu + "|Idioma:" + Obj.Idioma;
        }
    }
}




