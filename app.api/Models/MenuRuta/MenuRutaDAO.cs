using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;

namespace app.Models.MenuRuta
{
    /// <summary>Acceso a datos del modulo MenuRuta.</summary>
    internal class MenuRutaDAO
    {
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<MenuRutaDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<MenuRutaDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapMenuRuta(reader);
            });

            return new PaginacionResultado<MenuRutaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal MenuRutaDTO ObtenerPorRuta(string ruta)
        {
            string rutaNormalizada = Rutas.Normalizar(ruta);

            if (string.IsNullOrWhiteSpace(rutaNormalizada) || rutaNormalizada == "/")
                return new MenuRutaDTO();

            validateSQL.Validar(rutaNormalizada, nameof(ruta));

            return ObjDAL.EjecutarReader(
                QueryObtenerPorRuta(rutaNormalizada),
                MapMenuRuta).FirstOrDefault() ?? new MenuRutaDTO();
        }

        internal MenuRutaDTO Obtener(string ruta)
        {
            string rutaNormalizada = Rutas.Normalizar(ruta);

            if (string.IsNullOrWhiteSpace(rutaNormalizada) || rutaNormalizada == "/")
                return new MenuRutaDTO();

            validateSQL.Validar(rutaNormalizada, nameof(ruta));

            return ObjDAL.EjecutarReader(
                QueryObtener(rutaNormalizada),
                MapMenuRuta).FirstOrDefault() ?? new MenuRutaDTO();
        }

        internal MsjDB Agregar(MenuRutaDTO Obj)
        {
            Obj.Ruta = Rutas.Normalizar(Obj.Ruta);
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("MenuRuta", "CREADO", "Ruta:" + Obj.Ruta, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(MenuRutaDTO Obj)
        {
            Obj.Ruta = Rutas.Normalizar(Obj.Ruta);
            MenuRutaDTO ObjAnterior = Obtener(Obj.Ruta);
            Obj.Version = ObtenerVersion(Obj.Ruta);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("MenuRuta", "EDITADO", "Ruta:" + Obj.Ruta, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(MenuRutaDTO Obj)
        {
            Obj.Ruta = Rutas.Normalizar(Obj.Ruta);
            MenuRutaDTO ObjAnterior = Obtener(Obj.Ruta);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("MenuRuta", "Ruta", Obj.Ruta);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("MenuRuta", "ELIMINADO", "Ruta:" + Obj.Ruta, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal int ObtenerVersion(string ruta)
        {
            string rutaNormalizada = Rutas.Normalizar(ruta);
            validateSQL.Validar(rutaNormalizada, nameof(ruta));
            return ObjDAL.EjecutarScalar(QueryVersion(rutaNormalizada), 1);
        }

        internal List<MenuRutaDTO> Log(string ruta)
        {
            string rutaNormalizada = Rutas.Normalizar(ruta);
            validateSQL.Validar(rutaNormalizada, nameof(ruta));
            return ObjDAL.EjecutarReader(QueryLog(rutaNormalizada), MapMenuRutaLog);
        }

        internal bool VerificarRuta(MenuRutaDTO Obj)
        {
            Obj.Ruta = Rutas.Normalizar(Obj.Ruta);
            validateSQL.Validar(Obj.Ruta, nameof(Obj.Ruta));
            return ObjDAL.EjecutarExiste(QueryVerificarRuta(Obj));
        }

        internal bool TryObtener(string ruta, out (Menus Menu, Permisos PermisoEntrada) acceso)
        {
            string rutaNormalizada = Rutas.Normalizar(ruta);

            // Los movimientos de ingreso y salida usan menus distintos.  Se
            // resuelven antes de consultar MenuRuta para no heredar el permiso
            // generico del modulo cuando las rutas fueron separadas.
            if (rutaNormalizada.StartsWith("/aditivo/ingreso", StringComparison.OrdinalIgnoreCase))
            {
                acceso = (Menus.Aditivo, Permisos.Listar);
                return true;
            }

            if (rutaNormalizada.StartsWith("/aditivo/salida", StringComparison.OrdinalIgnoreCase))
            {
                acceso = (Menus.SalidaAditivo, Permisos.Listar);
                return true;
            }

            if (rutaNormalizada.StartsWith("/colorante/ingreso", StringComparison.OrdinalIgnoreCase))
            {
                acceso = (Menus.Colorante, Permisos.Listar);
                return true;
            }

            if (rutaNormalizada.StartsWith("/colorante/salida", StringComparison.OrdinalIgnoreCase))
            {
                acceso = (Menus.SalidaColorante, Permisos.Listar);
                return true;
            }

            // Configuracion hija de Usuario: usa los permisos ya existentes de configuracion de usuario.
            if (rutaNormalizada.Equals("/usuariosuplidor", StringComparison.OrdinalIgnoreCase)
                || rutaNormalizada.StartsWith("/usuariosuplidor/", StringComparison.OrdinalIgnoreCase))
            {
                acceso = (Menus.UsuarioConfiguracion, Permisos.Editar);
                return true;
            }

            MenuRutaDTO menuRuta = ObtenerPorRuta(ruta);

            if (menuRuta.CodMenu <= 0 || menuRuta.CodTipoPermiso <= 0)
            {
                acceso = (Menus.NoSeleccionado, Permisos.NoSeleccionado);
                return false;
            }

            acceso = ((Menus)menuRuta.CodMenu, (Permisos)menuRuta.CodTipoPermiso);
            return true;
        }

        private string Query(TipoDAL TipoDAL, MenuRutaDTO Obj)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO MenuRuta "
                        + "(Ruta, CodMenu, CodTipoPermiso, Estatus, Version, CodUsuarioCreacion, FechaCreacion) "
                        + "VALUES("
                        + "'" + Sql(Obj.Ruta) + "',"
                        + Obj.CodMenu + ","
                        + Obj.CodTipoPermiso + ","
                        + (Obj.Estatus ? "1" : "0") + ","
                        + Obj.Version + ","
                        + "'" + Sql(Obj.CodUsuarioCreacion) + "',"
                        + "GETDATE())";

                case TipoDAL.Editar:
                    return "UPDATE MenuRuta SET "
                        + "CodMenu=" + Obj.CodMenu + ","
                        + "CodTipoPermiso=" + Obj.CodTipoPermiso + ","
                        + "Estatus=" + (Obj.Estatus ? "1" : "0") + ","
                        + "Version=" + Obj.Version + ","
                        + "CodUsuarioActualizacion='" + Sql(Obj.CodUsuarioActualizacion) + "',"
                        + "FechaActualizacion=GETDATE() "
                        + "WHERE Ruta='" + Sql(Obj.Ruta) + "'";

                case TipoDAL.Eliminar:
                    return "DELETE FROM MenuRuta "
                        + "WHERE Ruta='" + Sql(Obj.Ruta) + "'";

                default:
                    return "";
            }
        }

        private string QueryObtenerPorRuta(string ruta)
        {
            return QueryObtenerBase(ruta, permitirRutaHija: true)
                + "AND A.[Estatus] = 1 "
                + "ORDER BY LEN(A.[Ruta]) DESC";
        }

        private string QueryObtener(string ruta)
        {
            return QueryObtenerBase(ruta);
        }

        private string QueryObtenerBase(string ruta, bool permitirRutaHija = false)
        {
            string rutaSql = Sql(ruta);
            string condicionRuta = permitirRutaHija
                ? "(A.[Ruta] = '" + rutaSql + "' OR '" + rutaSql + "' LIKE A.[Ruta] + '/%') "
                : "A.[Ruta] = '" + rutaSql + "' ";

            return "SELECT A.[Ruta], A.[CodMenu], M.[Descripcion] AS [MenuDescripcion], "
                + "A.[CodTipoPermiso], TP.[Descripcion] AS [TipoPermisoDescripcion], A.[Estatus] "
                + "FROM MenuRuta A "
                + "INNER JOIN Menu M ON A.[CodMenu] = M.[CodMenu] "
                + "INNER JOIN TipoPermiso TP ON A.[CodTipoPermiso] = TP.[CodTipoPermiso] "
                + "WHERE " + condicionRuta;
        }

        private string QueryListado()
        {
            return "SELECT A.[Ruta], A.[CodMenu], M.[Descripcion] AS [MenuDescripcion], "
                + "A.[CodTipoPermiso], TP.[Descripcion] AS [TipoPermisoDescripcion], A.[Estatus] "
                + "FROM MenuRuta A "
                + "INNER JOIN Menu M ON A.[CodMenu] = M.[CodMenu] "
                + "INNER JOIN TipoPermiso TP ON A.[CodTipoPermiso] = TP.[CodTipoPermiso] "
                + "ORDER BY A.[CodMenu], A.[Ruta]";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["ruta"] = "A.[Ruta]",
                ["codMenu"] = "A.[CodMenu]",
                ["menuDescripcion"] = "M.[Descripcion]",
                ["codTipoPermiso"] = "A.[CodTipoPermiso]",
                ["tipoPermisoDescripcion"] = "TP.[Descripcion]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "A.[Ruta]",
                    "CONVERT(VARCHAR(20), A.[CodMenu])",
                    "M.[Descripcion]",
                    "CONVERT(VARCHAR(20), A.[CodTipoPermiso])",
                    "TP.[Descripcion]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodMenu] ASC, A.[Ruta] ASC");

            return "SELECT A.[Ruta], A.[CodMenu], M.[Descripcion] AS [MenuDescripcion], "
                + "A.[CodTipoPermiso], TP.[Descripcion] AS [TipoPermisoDescripcion], A.[Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM MenuRuta A "
                + "INNER JOIN Menu M ON A.[CodMenu] = M.[CodMenu] "
                + "INNER JOIN TipoPermiso TP ON A.[CodTipoPermiso] = TP.[CodTipoPermiso] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryVersion(string ruta)
        {
            return "SELECT ISNULL(MAX(A.[Version]), 0) + 1 AS Version "
                + "FROM (SELECT * FROM MenuRuta_LOG UNION ALL SELECT * FROM MenuRuta) A "
                + "WHERE A.[Ruta] = '" + Sql(ruta) + "'";
        }

        private string QueryLog(string ruta)
        {
            return "SELECT A.[Ruta], A.[CodMenu], M.[Descripcion] AS [MenuDescripcion], "
                + "A.[CodTipoPermiso], TP.[Descripcion] AS [TipoPermisoDescripcion], A.[Estatus], "
                + "A.[Version], A.[CodUsuarioCreacion], A.[FechaCreacion], "
                + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                + "FROM (SELECT * FROM MenuRuta_LOG UNION ALL SELECT * FROM MenuRuta) A "
                + "INNER JOIN Menu M ON A.[CodMenu] = M.[CodMenu] "
                + "INNER JOIN TipoPermiso TP ON A.[CodTipoPermiso] = TP.[CodTipoPermiso] "
                + "WHERE A.[Ruta] = '" + Sql(ruta) + "' "
                + "ORDER BY A.[Version]";
        }

        private string QueryVerificarRuta(MenuRutaDTO Obj)
        {
            return "SELECT 1 "
                + "FROM MenuRuta A "
                + "WHERE A.[Ruta] = '" + Sql(Obj.Ruta) + "'";
        }

        private string Sql(string? value)
        {
            return (value ?? "").Replace("'", "''");
        }

        private MenuRutaDTO MapMenuRuta(SqlDataReader reader)
        {
            return new MenuRutaDTO
            {
                Ruta = reader["Ruta"].ToString() ?? "",
                CodMenu = Convert.ToInt32(reader["CodMenu"]),
                MenuDescripcion = reader["MenuDescripcion"].ToString() ?? "",
                CodTipoPermiso = Convert.ToInt32(reader["CodTipoPermiso"]),
                TipoPermisoDescripcion = reader["TipoPermisoDescripcion"].ToString() ?? "",
                Estatus = Convert.ToBoolean(reader["Estatus"])
            };
        }

        private MenuRutaDTO MapMenuRutaLog(SqlDataReader reader)
        {
            MenuRutaDTO Obj = MapMenuRuta(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (!string.IsNullOrEmpty(Obj.CodUsuarioCreacion))
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion);

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime fechaCreacion))
                Obj.FechaCreacion = fechaCreacion;

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (!string.IsNullOrEmpty(Obj.CodUsuarioActualizacion))
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion);

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime fechaActualizacion))
                Obj.FechaActualizacion = fechaActualizacion;
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }
    }
}




