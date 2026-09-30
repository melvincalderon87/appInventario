using app.Models.Menu;
using app.Models.Roles;
using app.Models.LogModificaciones;
using app.Models.Paginacion;

namespace app.Models.Permiso
{
    /// <summary>Acceso a datos del modulo Permiso.</summary>
    internal class PermisoDAO
    {
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal bool Verificar(int CodRol, Menus CodMenu, Permisos CodTipoPermiso)
        {
            return ObjDAL.EjecutarExiste(QueryVerificar(CodRol, (int)CodMenu, (int)CodTipoPermiso));
        }

        internal List<PermisoListadoDTO> Listado(int CodRol)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listado, CodKey: CodRol), MapPermisoListado);
        }

        internal PaginacionResultado<PermisoRolDTO> ListadoPorRol(
            int CodRol,
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<PermisoRolDTO> items = ObjDAL.EjecutarReader(QueryListadoPorRol(CodRol, paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapPermisoRol(reader);
            });

            return new PaginacionResultado<PermisoRolDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal PermisoListadoDTO Obtener(int CodRol, int CodMenu)
        {
            return ObjDAL.EjecutarReader(Query(CodKey: CodRol, CodMenu: CodMenu), MapPermisoListado).FirstOrDefault()
                ?? CrearListadoVacio(CodRol, CodMenu);
        }

        internal PermisoListadoDTO ObtenerListadoPantalla(int CodRol, Menus CodMenu)
        {
            return Obtener(CodRol, (int)CodMenu);
        }

        internal PermisoDTO ObtenerPermiso(int CodRol, int CodMenu, int CodTipoPermiso)
        {
            return ObjDAL.EjecutarReader(
                Query(TipoDAL.Obtener, CodKey: CodRol, CodMenu: CodMenu, CodTipoPermiso: CodTipoPermiso),
                MapPermiso).FirstOrDefault() ?? new PermisoDTO();
        }

        internal MsjDB Agregar(PermisoDTO Obj)
        {
            Obj.Version = ObtenerVersion(Obj.CodRol, Obj.CodMenu, Obj.CodTipoPermiso);
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            string Llave = ObtenerLlave(Obj);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Permiso", "CREADO", Llave, Nuevo: Obj);
            }
            return MsjDB;
        }

        internal MsjDB Eliminar(PermisoDTO Obj)
        {
            PermisoDTO ObjAnterior = ObtenerPermiso(Obj.CodRol, Obj.CodMenu, Obj.CodTipoPermiso);
            string Llave = ObtenerLlave(Obj);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);
            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Permiso", "ELIMINADO", Llave, Anterior: ObjAnterior);
            }
            return MsjDB;
        }

        internal int ObtenerVersion(int CodRol, int CodMenu, int CodTipoPermiso)
        {
            return ObjDAL.EjecutarScalar(
                Query(TipoDAL.Version, CodKey: CodRol, CodMenu: CodMenu, CodTipoPermiso: CodTipoPermiso), 1);
        }

        internal List<PermisoDTO> Log(int CodRol, int CodMenu)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodRol, CodMenu: CodMenu), MapPermisoLog);
        }

        internal string Query(
            TipoDAL TipoDAL = TipoDAL.NoSeleccionado,
            int CodKey = 0,
            int CodMenu = 0,
            int CodTipoPermiso = 0,
            PermisoDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Permiso (CodRol, CodMenu, CodTipoPermiso,"
                        + "Version,CodUsuarioCreacion,FechaCreacion) "
                        + "VALUES('"
                        + Obj.CodRol + "', '"
                        + Obj.CodMenu + "','"
                        + Obj.CodTipoPermiso + "','"
                        + Obj.Version + "','"
                        + Obj.CodUsuarioCreacion + "',"
                        + "GETDATE()" + ")";

                case TipoDAL.Editar:
                    return "";

                case TipoDAL.Eliminar:
                    return "DELETE FROM Permiso WHERE CodRol='" + Obj.CodRol
                        + "' AND CodMenu = '" + Obj.CodMenu
                        + "' AND CodTipoPermiso='" + Obj.CodTipoPermiso + "'";

                case TipoDAL.Listado:
                    return QueryListadoPermisos(CodKey);

                case TipoDAL.Listar:
                    return "SELECT A.[CodRol], A.[CodMenu], A.[CodTipoPermiso] FROM Permiso A ";

                case TipoDAL.Obtener:
                    return "SELECT A.[CodRol],A.[CodMenu],A.[CodTipoPermiso] "
                        + "FROM Permiso A "
                        + "WHERE A.[CodRol]='" + CodKey + "' "
                        + "AND A.[CodMenu] = '" + CodMenu + "' "
                        + "AND A.[CodTipoPermiso]='" + CodTipoPermiso + "'";

                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' "
                        + "FROM (SELECT * FROM Permiso_LOG UNION ALL SELECT * FROM Permiso) A "
                        + "WHERE A.[CodRol]='" + CodKey + "' "
                        + "AND A.[CodMenu] = '" + CodMenu + "' "
                        + "AND A.[CodTipoPermiso]='" + CodTipoPermiso + "'";

                case TipoDAL.Log:
                    return "SELECT A.[CodRol],A.[CodMenu],A.[CodTipoPermiso],"
                        + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                        + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                        + "FROM (SELECT * FROM Permiso_LOG UNION ALL SELECT * FROM Permiso) A "
                        + "WHERE A.[CodRol] = '" + CodKey + "' "
                        + "AND A.[CodMenu]='" + CodMenu + "' "
                        + "ORDER BY A.Version ";

                default:
                    return QueryListadoPermisos(CodKey, CodMenu);
            }
        }

        private string QueryVerificar(int CodRol, int CodMenu, int CodTipoPermiso)
        {
            return "SELECT 'TRUE' "
                + "FROM Permiso A "
                + "WHERE A.[CodRol] = " + CodRol + " "
                + "AND A.[CodMenu] = " + CodMenu + " "
                + "AND A.[CodTipoPermiso] = " + CodTipoPermiso;
        }

        private string QueryListadoPermisos(int CodRol, int CodMenu = 0)
        {
            string filtroMenu = CodMenu > 0 ? " AND A.[CodMenu] = '" + CodMenu + "'" : "";

            return "SELECT A.[CodRol], B.[Descripcion] AS [RolDescripcion], A.[CodMenu], M.[Descripcion] AS [MenuDescripcion], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 1 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [LISTADO], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 2 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [AGREGAR], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 3 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [EDITAR], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 4 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [ELIMINAR], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 5 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [VISUALIZAR], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 6 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [IMPRIMIR], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 7 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [REPORTE], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 8 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [EXPORTAR], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 9 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [APROBAR], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 10 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [LOG], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 11 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [OTRO], "
                + "CASE WHEN MAX(CASE WHEN A.[CodTipoPermiso] = 12 THEN 1 ELSE 0 END) = 1 THEN 'SI' ELSE 'NO' END AS [MENU] "
                + "FROM Permiso A "
                + "INNER JOIN Rol B ON A.[CodRol] = B.[CodRol] "
                + "INNER JOIN Menu M ON A.[CodMenu] = M.[CodMenu] "
                + "WHERE A.[CodRol] = '" + CodRol + "'" + filtroMenu + " "
                + "GROUP BY A.[CodRol], B.[Descripcion], A.[CodMenu], M.[Descripcion] "
                + "ORDER BY A.[CodMenu]";
        }

        private string QueryListadoPorRol(int CodRol, PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codMenu"] = "M.[CodMenu]",
                ["menuDescripcion"] = "M.[Descripcion]"
            };
            string where = "WHERE M.[Estatus] = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), M.[CodMenu])",
                    "M.[Descripcion]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "M.[CodMenu] ASC");

            return "WITH MenusPagina AS ("
                + "SELECT M.[CodMenu], M.[Descripcion] AS [MenuDescripcion], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Menu M "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion)
                + ") "
                + "SELECT R.[CodRol], R.[Descripcion] AS [RolDescripcion], "
                + "MP.[CodMenu], MP.[MenuDescripcion], "
                + "TP.[CodTipoPermiso], TP.[Descripcion] AS [TipoPermisoDescripcion], "
                + "CASE WHEN EXISTS ("
                + "SELECT 1 "
                + "FROM Permiso P "
                + "WHERE P.[CodRol] = R.[CodRol] "
                + "  AND P.[CodMenu] = MP.[CodMenu] "
                + "  AND P.[CodTipoPermiso] = TP.[CodTipoPermiso]"
                + ") THEN 1 ELSE 0 END AS [Asignado], "
                + "MP.[" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Rol R "
                + "CROSS JOIN MenusPagina MP "
                + "CROSS JOIN TipoPermiso TP "
                + "WHERE R.[CodRol] = '" + CodRol + "' "
                + "AND TP.[CodTipoPermiso] > 0 "
                + "ORDER BY MP.[CodMenu], TP.[CodTipoPermiso]";
        }

        private PermisoListadoDTO MapPermisoListado(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            PermisoListadoDTO Obj = new PermisoListadoDTO();
            Obj.CodRol = Convert.ToInt32(reader["CodRol"]);
            Obj.IdRol = ObjEncriptacion.Encriptar(Obj.CodRol.ToString());
            Obj.RolDescripcion = reader["RolDescripcion"].ToString() ?? "";
            Obj.CodMenu = Convert.ToInt32(reader["CodMenu"]);
            Obj.IdMenu = ObjEncriptacion.Encriptar(Obj.CodMenu.ToString());
            Obj.MenuDescripcion = reader["MenuDescripcion"].ToString() ?? "";
            Obj.Listado = reader["LISTADO"].ToString() ?? "";
            Obj.Agregar = reader["AGREGAR"].ToString() ?? "";
            Obj.Editar = reader["EDITAR"].ToString() ?? "";
            Obj.Eliminar = reader["ELIMINAR"].ToString() ?? "";
            Obj.Visualizar = reader["VISUALIZAR"].ToString() ?? "";
            Obj.Imprimir = reader["IMPRIMIR"].ToString() ?? "";
            Obj.Reporte = reader["REPORTE"].ToString() ?? "";
            Obj.Exportar = reader["EXPORTAR"].ToString() ?? "";
            Obj.Aprobar = reader["APROBAR"].ToString() ?? "";
            Obj.Log = reader["LOG"].ToString() ?? "";
            Obj.Otro = reader["OTRO"].ToString() ?? "";
            Obj.Menu = reader["MENU"].ToString() ?? "";
            return Obj;
        }

        private PermisoRolDTO MapPermisoRol(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            return new PermisoRolDTO
            {
                CodRol = Convert.ToInt32(reader["CodRol"]),
                IdRol = ObjEncriptacion.Encriptar(reader["CodRol"].ToString()),
                RolDescripcion = reader["RolDescripcion"].ToString() ?? "",
                CodMenu = Convert.ToInt32(reader["CodMenu"]),
                IdMenu = ObjEncriptacion.Encriptar(reader["CodMenu"].ToString()),
                MenuDescripcion = reader["MenuDescripcion"].ToString() ?? "",
                CodTipoPermiso = Convert.ToInt32(reader["CodTipoPermiso"]),
                TipoPermisoDescripcion = reader["TipoPermisoDescripcion"].ToString() ?? "",
                Asignado = Convert.ToInt32(reader["Asignado"]) == 1
            };
        }

        private PermisoDTO MapPermiso(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            RolDAO Rol = new RolDAO();
            MenuDAO Menu = new MenuDAO();
            PermisoDTO Obj = new PermisoDTO();
            Obj.CodRol = Convert.ToInt32(reader["CodRol"]);
            Obj.Rol = Rol.Obtener(Obj.CodRol);
            Obj.CodMenu = Convert.ToInt32(reader["CodMenu"]);
            Obj.Menu = Menu.Obtener(Obj.CodMenu);
            Obj.CodTipoPermiso = Convert.ToInt32(reader["CodTipoPermiso"]);
            return Obj;
        }

        private PermisoDTO MapPermisoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            PermisoDTO Obj = MapPermiso(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion ?? "");

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime FechaCreacion))
                Obj.FechaCreacion = FechaCreacion;

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion ?? "");

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime FechaActualizacion))
                Obj.FechaActualizacion = FechaActualizacion;
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private PermisoListadoDTO CrearListadoVacio(int CodRol, int CodMenu)
        {
            return new PermisoListadoDTO
            {
                IdRol = ObjEncriptacion.Encriptar(CodRol.ToString()),
                IdMenu = ObjEncriptacion.Encriptar(CodMenu.ToString()),
                CodRol = CodRol,
                CodMenu = CodMenu,
                Listado = "NO",
                Agregar = "NO",
                Editar = "NO",
                Eliminar = "NO",
                Visualizar = "NO",
                Imprimir = "NO",
                Reporte = "NO",
                Exportar = "NO",
                Aprobar = "NO",
                Log = "NO",
                Otro = "NO",
                Menu = "NO",
            };
        }

        private string ObtenerLlave(PermisoDTO Obj)
        {
            return "CodRol:" + Obj.CodRol + "|CodMenu:" + Obj.CodMenu + "|CodTipoPermiso:" + Obj.CodTipoPermiso;
        }
    }
}




