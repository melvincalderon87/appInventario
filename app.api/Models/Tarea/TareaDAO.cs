using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace app.Models.Tarea
{
    /// <summary>Acceso a datos del modulo Tarea.</summary>
    internal class TareaDAO
    {
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<TareaDTO> Listado(
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<TareaDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapTarea(reader);
            });

            return new PaginacionResultado<TareaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodTarea"].ToString()
            });
        }

        internal TareaDTO Obtener(int CodTarea)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodTarea), MapTarea).FirstOrDefault()
                ?? new TareaDTO();
        }

        internal MsjDB Agregar(TareaDTO Obj)
        {
            Obj.Version = 1;
            Obj.Estatus = true;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararTarea(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: true, tipoDAL: TipoDAL.Agregar);
            if (msjDB.Estatus == true)
            {
                Obj.CodTarea = msjDB.Key;
                LogModificacionDAO.Registrar("Tarea", "CREADO", "CodTarea:" + Obj.CodTarea, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Editar(TareaDTO Obj)
        {
            TareaDTO ObjAnterior = Obtener(Obj.CodTarea);
            if (ObjAnterior.CodTarea <= 0)
                return Error("Tarea no encontrada.");

            Obj.Version = ObtenerVersion(Obj.CodTarea);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararTarea(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);
            if (msjDB.Estatus == true)
                LogModificacionDAO.Registrar("Tarea", "EDITADO", "CodTarea:" + Obj.CodTarea, Anterior: ObjAnterior, Nuevo: Obj);

            return msjDB;
        }

        internal MsjDB Eliminar(int CodTarea)
        {
            TareaDTO ObjAnterior = Obtener(CodTarea);
            if (ObjAnterior.CodTarea <= 0)
                return Error("Tarea no encontrada.");

            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Tarea", "CodTarea", CodTarea);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            TareaDTO Obj = new TareaDTO
            {
                CodTarea = CodTarea,
                Version = ObtenerVersion(CodTarea),
                CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario()
            };
            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);
            if (msjDB.Estatus == true)
                LogModificacionDAO.Registrar("Tarea", "ELIMINADO", "CodTarea:" + CodTarea, Anterior: ObjAnterior);

            return msjDB;
        }

        internal bool VerificarDescripcion(TareaDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodTarea)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodTarea), 1);
        }

        internal List<TareaDTO> Log(int CodTarea)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodTarea), MapTareaLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, TareaDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "DECLARE @CodTarea INT; "
                        + "IF COLUMNPROPERTY(OBJECT_ID('dbo.Tarea'), 'CodTarea', 'IsIdentity') = 1 "
                        + "BEGIN "
                        + "INSERT INTO Tarea (Descripcion,Tiempo,Estatus,Version,CodUsuarioCreacion,FechaCreacion) VALUES(N'"
                        + SqlTexto(Obj!.Descripcion) + "',N'"
                        + SqlTexto(Obj.Tiempo) + "',"
                        + SqlBit(Obj.Estatus) + ","
                        + Obj.Version + ",N'"
                        + SqlTexto(Obj.CodUsuarioCreacion) + "',GETDATE()); "
                        + "SET @CodTarea = CAST(SCOPE_IDENTITY() AS INT); "
                        + "END "
                        + "ELSE "
                        + "BEGIN "
                        + "SELECT @CodTarea = ISNULL(MAX(CodTarea), 0) + 1 FROM Tarea WITH (UPDLOCK, HOLDLOCK); "
                        + "INSERT INTO Tarea (CodTarea,Descripcion,Tiempo,Estatus,Version,CodUsuarioCreacion,FechaCreacion) VALUES(@CodTarea,N'"
                        + SqlTexto(Obj.Descripcion) + "',N'"
                        + SqlTexto(Obj.Tiempo) + "',"
                        + SqlBit(Obj.Estatus) + ","
                        + Obj.Version + ",N'"
                        + SqlTexto(Obj.CodUsuarioCreacion) + "',GETDATE()); "
                        + "END "
                        + "SELECT @CodTarea;";
                case TipoDAL.Editar:
                    return "UPDATE Tarea SET Descripcion=N'"
                        + SqlTexto(Obj!.Descripcion) + "',Tiempo=N'"
                        + SqlTexto(Obj.Tiempo) + "',Estatus="
                        + SqlBit(Obj.Estatus) + ",Version="
                        + Obj.Version + ",CodUsuarioActualizacion=N'"
                        + SqlTexto(Obj.CodUsuarioActualizacion)
                        + "',FechaActualizacion=GETDATE() WHERE CodTarea='"
                        + Obj.CodTarea + "'";
                case TipoDAL.Eliminar:
                    return "UPDATE Tarea SET Estatus=0,Version="
                        + Obj!.Version + ",CodUsuarioActualizacion=N'"
                        + SqlTexto(Obj.CodUsuarioActualizacion)
                        + "',FechaActualizacion=GETDATE() WHERE CodTarea='"
                        + Obj.CodTarea + "'";
                case TipoDAL.Listado:
                    return SelectBase();
                case TipoDAL.Listar:
                    return "SELECT A.[CodTarea],A.[Descripcion] FROM Tarea A WHERE A.[Estatus] = 1 ORDER BY A.[Descripcion]";
                case TipoDAL.Obtener:
                    return SelectBase("WHERE A.[CodTarea]='" + CodKey + "' ");
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Tarea A "
                        + "WHERE A.[Descripcion]=N'" + SqlTexto(Obj!.Descripcion) + "' "
                        + "AND A.[CodTarea] <> '" + Obj.CodTarea + "' "
                        + "AND A.[Estatus] = 1";
                case TipoDAL.Version:
                    return "IF OBJECT_ID('dbo.Tarea_LOG', 'U') IS NOT NULL "
                        + "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Tarea_LOG UNION ALL SELECT * FROM Tarea) A "
                        + "WHERE A.[CodTarea]='" + CodKey + "' "
                        + "ELSE SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM Tarea A "
                        + "WHERE A.[CodTarea]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "IF OBJECT_ID('dbo.Tarea_LOG', 'U') IS NOT NULL "
                        + SelectLog("(SELECT * FROM Tarea_LOG UNION ALL SELECT * FROM Tarea)", CodKey)
                        + "ELSE "
                        + SelectLog("Tarea", CodKey);
                default:
                    return "";
            }
        }

        private MsjDB PrepararTarea(TareaDTO Obj)
        {
            Obj.Descripcion = (Obj.Descripcion ?? "").Trim();
            Obj.Tiempo = (Obj.Tiempo ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.Descripcion))
                return Error("La descripcion de la tarea es requerida.");

            if (Obj.Descripcion.Length > 250)
                return Error("La descripcion de la tarea debe tener maximo 250 caracteres.");

            if (Obj.Tiempo.Length > 100)
                return Error("El tiempo debe tener maximo 100 caracteres.");

            if (VerificarDescripcion(Obj))
                return Error("Ya existe una tarea con esa descripcion.");

            return Ok();
        }

        private string SelectBase(string where = "")
        {
            return "SELECT A.[CodTarea],A.[Descripcion],A.[Tiempo],A.[Estatus],"
                + "COUNT(N.[CodNotificacion]) AS [NotificacionCantidad] "
                + "FROM Tarea A "
                + "LEFT JOIN Notificacion N ON A.[CodTarea] = N.[CodTarea] AND N.[Estatus] = 1 "
                + where
                + "GROUP BY A.[CodTarea],A.[Descripcion],A.[Tiempo],A.[Estatus] ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codTarea"] = "A.[CodTarea]",
                ["descripcion"] = "A.[Descripcion]",
                ["tiempo"] = "A.[Tiempo]",
                ["estatus"] = "A.[Estatus]",
                ["notificacionCantidad"] = "COUNT(N.[CodNotificacion])"
            };
            string where = "WHERE A.[Estatus] = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodTarea])",
                    "A.[Descripcion]",
                    "A.[Tiempo]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodTarea] ASC");

            return "SELECT A.[CodTarea],A.[Descripcion],A.[Tiempo],A.[Estatus],"
                + "COUNT(N.[CodNotificacion]) AS [NotificacionCantidad],"
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Tarea A "
                + "LEFT JOIN Notificacion N ON A.[CodTarea] = N.[CodTarea] AND N.[Estatus] = 1 "
                + where
                + "GROUP BY A.[CodTarea],A.[Descripcion],A.[Tiempo],A.[Estatus] "
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string SelectLog(string tableName, int codTarea)
        {
            return "SELECT A.[CodTarea],A.[Descripcion],A.[Tiempo],A.[Estatus],"
                + "0 AS [NotificacionCantidad],A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                + "FROM " + tableName + " A "
                + "WHERE A.[CodTarea] = '" + codTarea + "' "
                + "ORDER BY A.Version ";
        }

        private TareaDTO MapTarea(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TareaDTO Obj = new TareaDTO();
            Obj.CodTarea = Convert.ToInt32(reader["CodTarea"]);
            Obj.IdTarea = ObjEncriptacion.Encriptar(Obj.CodTarea.ToString());
            Obj.Descripcion = reader["Descripcion"].ToString() ?? "";
            Obj.Tiempo = reader["Tiempo"].ToString() ?? "";
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            Obj.NotificacionCantidad = Convert.ToInt32(reader["NotificacionCantidad"]);
            return Obj;
        }

        private TareaDTO MapTareaLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TareaDTO Obj = MapTarea(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioCreacion))
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion);

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime FechaCreacion))
                Obj.FechaCreacion = FechaCreacion;

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioActualizacion))
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion);

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime FechaActualizacion))
                Obj.FechaActualizacion = FechaActualizacion;
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private MsjDB Ok()
        {
            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }

        private MsjDB Error(string mensaje)
        {
            return new MsjDB { Estatus = false, Msj = mensaje, Key = 0 };
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string SqlBit(bool valor)
        {
            return valor ? "1" : "0";
        }
    }
}





