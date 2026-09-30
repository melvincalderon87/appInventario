using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Globalization;
using System.Text;

namespace app.Models.Barco
{
    /// <summary>
    /// DAO para el mantenimiento de barcos.
    /// </summary>
    internal class BarcoDAO
    {
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<BarcoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<BarcoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapBarco(reader);
            });

            return new PaginacionResultado<BarcoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Barco"].ToString(),
                Value = reader["CodBarco"].ToString()
            });
        }

        internal List<SelectListItem> ListarProductosCombustible()
        {
            const string query = "SELECT P.[CodProducto], P.[Producto] FROM Producto P "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE UPPER(TP.[Descripcion]) = UPPER('Combustibles') ORDER BY P.[Producto]";
            return ObjDAL.EjecutarReader(query, reader => new SelectListItem
            {
                Value = reader["CodProducto"].ToString(),
                Text = reader["Producto"].ToString()
            });
        }

        internal List<SelectListItem> BuscarOpcion(string search = "", int limite = 20)
        {
            int top = Math.Clamp(limite, 1, 20);

            return ObjDAL.EjecutarReader(QueryBuscarOpcion(search, top), reader => new SelectListItem()
            {
                Text = reader["Barco"].ToString(),
                Value = reader["CodBarco"].ToString()
            });
        }

        internal List<SelectListItem> ListarIngresadosRecientemente()
        {
            return ObjDAL.EjecutarReader(QueryIngresadosRecientementeOpcion(), reader => new SelectListItem()
            {
                Text = reader["Barco"].ToString(),
                Value = reader["CodBarco"].ToString()
            });
        }

        internal List<SelectListItem> ListarFechaPrevistaUltimosDosMeses()
        {
            return ObjDAL.EjecutarReader(QueryFechaPrevistaUltimosDosMesesOpcion(), reader => new SelectListItem()
            {
                Text = reader["Barco"].ToString(),
                Value = reader["CodBarco"].ToString()
            });
        }

        internal BarcoDTO Obtener(int CodBarco)
        {
            BarcoDTO barco = ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodBarco), MapBarco).FirstOrDefault() ?? new BarcoDTO();

            if (barco.CodBarco > 0)
                barco.Detalles = ObtenerDetalles(CodBarco);

            return barco;
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(BarcoDTO Obj)
        {
            Obj.CodBarco = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararBarco(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Barco", "CREADO", "CodBarco:" + Obj.CodBarco, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Editar(BarcoDTO Obj)
        {
            BarcoDTO ObjAnterior = Obtener(Obj.CodBarco);
            if (ObjAnterior.CodBarco <= 0)
                return Error("Barco no encontrado.");

            Obj.Version = ObtenerVersion(Obj.CodBarco);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararBarco(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Barco", "EDITADO", "CodBarco:" + Obj.CodBarco, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Eliminar(BarcoDTO Obj)
        {
            BarcoDTO ObjAnterior = Obtener(Obj.CodBarco);
            if (ObjAnterior.CodBarco <= 0)
                return Error("Barco no encontrado.");

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Barco", "ELIMINADO", "CodBarco:" + Obj.CodBarco, Anterior: ObjAnterior);
            }

            return msjDB;
        }

        internal bool VerificarBarco(BarcoDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodBarco)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodBarco), 1);
        }

        internal List<BarcoDTO> Log(int CodBarco)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodBarco), MapBarcoLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, BarcoDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return QueryAgregar(Obj!);
                case TipoDAL.Editar:
                    return QueryEditar(Obj!);
                case TipoDAL.Eliminar:
                    return "BEGIN TRY BEGIN TRANSACTION; "
                        + "DELETE FROM BarcoDetalle WHERE CodBarco='" + Obj!.CodBarco + "'; "
                        + "DELETE FROM Barco WHERE CodBarco='" + Obj.CodBarco + "'; "
                        + "COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH";
                case TipoDAL.Listado:
                    return SelectBase();
                case TipoDAL.Listar:
                    return "SELECT A.[CodBarco],A.[Barco] FROM Barco A ORDER BY A.[Barco]";
                case TipoDAL.Obtener:
                    return SelectBase("WHERE A.[CodBarco]='" + CodKey + "' ");
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodBarco]),0)+1 as 'CodBarco' FROM Barco A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Barco A "
                        + "WHERE A.[Barco]='" + SqlTexto(Obj!.Barco) + "' "
                        + "AND A.[CodBarco] <> '" + Obj.CodBarco + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Barco_LOG UNION ALL SELECT * FROM Barco) A "
                        + "WHERE A.[CodBarco]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodBarco],A.[Barco],A.[FechaPrevista],A.[Comentario],"
                        + "0 AS [DetalleCantidad],CAST(0 AS DECIMAL(18,4)) AS [CantidadTotal],"
                        + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                        + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                        + "FROM (SELECT * FROM Barco_LOG UNION ALL SELECT * FROM Barco) A "
                        + "WHERE A.[CodBarco] = '" + CodKey + "' "
                        + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private MsjDB PrepararBarco(BarcoDTO Obj)
        {
            Obj.Barco = (Obj.Barco ?? "").Trim();
            Obj.Comentario = (Obj.Comentario ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.Barco))
                return Error("El nombre del barco es requerido.");

            if (!Obj.FechaPrevista.HasValue)
                return Error("La fecha prevista es requerida.");

            Obj.FechaPrevista = Obj.FechaPrevista.Value.Date;

            if (VerificarBarco(Obj))
                return Error("Ya existe un barco con ese nombre.");

            if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                return Error("Debe agregar al menos una fila al detalle del barco.");

            for (int index = 0; index < Obj.Detalles.Count; index++)
            {
                BarcoDetalleDTO detalle = Obj.Detalles[index];
                detalle.CodBarco = Obj.CodBarco;
                detalle.Linea = index + 1;

                if (detalle.CodSuplidor <= 0)
                    return Error("El suplidor es requerido en todas las filas.");

                if (detalle.CodProducto <= 0)
                    return Error("El producto es requerido en todas las filas.");

                if (detalle.Cantidad <= 0)
                    return Error("La cantidad debe ser mayor a cero en todas las filas.");

                if (!SocioExiste(detalle.CodSuplidor))
                    return Error("Uno de los suplidores seleccionados no existe.");

                if (!ProductoEsCombustible(detalle.CodProducto))
                    return Error("Los productos seleccionados deben ser de tipo combustible.");
            }

            return Ok();
        }

        private string QueryAgregar(BarcoDTO Obj)
        {
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("INSERT INTO Barco (CodBarco,Barco,FechaPrevista,Comentario,Version,CodUsuarioCreacion,FechaCreacion) VALUES('");
            query.Append(Obj.CodBarco).Append("','");
            query.Append(SqlTexto(Obj.Barco)).Append("',");
            query.Append(SqlFecha(Obj.FechaPrevista)).Append(",'");
            query.Append(SqlTexto(Obj.Comentario)).Append("','");
            query.Append(Obj.Version).Append("','");
            query.Append(SqlTexto(Obj.CodUsuarioCreacion)).Append("',GETDATE()); ");
            query.Append(QueryInsertarDetalles(Obj));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryEditar(BarcoDTO Obj)
        {
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("UPDATE Barco SET Barco='");
            query.Append(SqlTexto(Obj.Barco)).Append("',FechaPrevista=");
            query.Append(SqlFecha(Obj.FechaPrevista)).Append(",Comentario='");
            query.Append(SqlTexto(Obj.Comentario)).Append("',Version=");
            query.Append(Obj.Version).Append(",CodUsuarioActualizacion='");
            query.Append(SqlTexto(Obj.CodUsuarioActualizacion));
            query.Append("',FechaActualizacion=GETDATE() WHERE CodBarco='");
            query.Append(Obj.CodBarco).Append("'; ");
            query.Append("DELETE FROM BarcoDetalle WHERE CodBarco='").Append(Obj.CodBarco).Append("'; ");
            query.Append(QueryInsertarDetalles(Obj));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryInsertarDetalles(BarcoDTO Obj)
        {
            if (Obj.Detalles.Count == 0)
                return "";

            List<string> values = Obj.Detalles.Select(detalle =>
                "('" + Obj.CodBarco + "','" + detalle.Linea + "','" + detalle.CodSuplidor + "','" + detalle.CodProducto + "'," + SqlNumero(detalle.Cantidad) + ")"
            ).ToList();

            return "INSERT INTO BarcoDetalle (CodBarco,Linea,CodSuplidor,CodProducto,Cantidad) VALUES "
                + string.Join(",", values) + "; ";
        }

        private string SelectBase(string where = "")
        {
            return "SELECT A.[CodBarco],A.[Barco],A.[FechaPrevista],A.[Comentario],"
                + "COUNT(B.[Linea]) AS [DetalleCantidad],"
                + "ISNULL(SUM(B.[Cantidad]),0) AS [CantidadTotal] "
                + "FROM Barco A "
                + "LEFT JOIN BarcoDetalle B ON A.[CodBarco] = B.[CodBarco] "
                + where
                + "GROUP BY A.[CodBarco],A.[Barco],A.[FechaPrevista],A.[Comentario] ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codBarco"] = "A.[CodBarco]",
                ["barco"] = "A.[Barco]",
                ["fechaPrevista"] = "A.[FechaPrevista]",
                ["comentario"] = "A.[Comentario]",
                ["detalleCantidad"] = "COUNT(B.[Linea])",
                ["cantidadTotal"] = "ISNULL(SUM(B.[Cantidad]),0)"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodBarco])",
                    "A.[Barco]",
                    "CONVERT(VARCHAR(10), A.[FechaPrevista], 103)",
                    "A.[Comentario]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodBarco] ASC");

            return "SELECT A.[CodBarco],A.[Barco],A.[FechaPrevista],A.[Comentario],"
                + "COUNT(B.[Linea]) AS [DetalleCantidad],"
                + "ISNULL(SUM(B.[Cantidad]),0) AS [CantidadTotal],"
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Barco A "
                + "LEFT JOIN BarcoDetalle B ON A.[CodBarco] = B.[CodBarco] "
                + where
                + "GROUP BY A.[CodBarco],A.[Barco],A.[FechaPrevista],A.[Comentario] "
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryBuscarOpcion(string search, int limite)
        {
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodBarco])",
                    "A.[Barco]"
                });

            return "SELECT TOP (" + limite + ") A.[CodBarco],A.[Barco] "
                + "FROM Barco A "
                + where
                + "ORDER BY A.[CodBarco] DESC";
        }

        private string QueryIngresadosRecientementeOpcion()
        {
            return "SELECT A.[CodBarco], A.[Barco] "
                + "FROM Barco A "
                + "INNER JOIN IngresoBarco I ON I.[CodBarco] = A.[CodBarco] "
                + "WHERE I.[FechaIngreso] >= DATEADD(MONTH, -2, CAST(GETDATE() AS DATE)) "
                + "GROUP BY A.[CodBarco], A.[Barco] "
                + "ORDER BY MAX(I.[FechaIngreso]) DESC, A.[Barco]";
        }

        private string QueryFechaPrevistaUltimosDosMesesOpcion()
        {
            return "SELECT A.[CodBarco], A.[Barco] "
                + "FROM Barco A "
                + "WHERE A.[FechaPrevista] >= DATEADD(MONTH, -2, CAST(GETDATE() AS DATE)) "
                + "AND A.[FechaPrevista] <= CAST(GETDATE() AS DATE) "
                + "ORDER BY A.[FechaPrevista] DESC, A.[Barco]";
        }

        private List<BarcoDetalleDTO> ObtenerDetalles(int CodBarco)
        {
            return ObjDAL.EjecutarReader(QueryDetalles(CodBarco), MapBarcoDetalle);
        }

        private string QueryDetalles(int CodBarco)
        {
            return "SELECT A.[CodBarco],A.[Linea],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],A.[Cantidad] "
                + "FROM BarcoDetalle A "
                + "INNER JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "INNER JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "WHERE A.[CodBarco]='" + CodBarco + "' "
                + "ORDER BY A.[Linea]";
        }

        private bool SocioExiste(int CodSuplidor)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Suplidor A WHERE A.[CodSuplidor]='" + CodSuplidor + "'");
        }

        private bool ProductoEsCombustible(int CodProducto)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Producto P INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE P.[CodProducto]='" + CodProducto + "' AND UPPER(TP.[Descripcion]) = UPPER('Combustibles')");
        }

        private BarcoDTO MapBarco(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BarcoDTO Obj = new BarcoDTO();
            Obj.CodBarco = Convert.ToInt32(reader["CodBarco"]);
            Obj.IdBarco = ObjEncriptacion.Encriptar(Obj.CodBarco.ToString());
            Obj.Barco = reader["Barco"].ToString() ?? "";
            if (reader["FechaPrevista"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaPrevista"].ToString(), out DateTime FechaPrevista))
                Obj.FechaPrevista = FechaPrevista;
            Obj.Comentario = reader["Comentario"].ToString() ?? "";
            Obj.DetalleCantidad = Convert.ToInt32(reader["DetalleCantidad"]);
            Obj.CantidadTotal = Convert.ToDecimal(reader["CantidadTotal"]);
            return Obj;
        }

        private BarcoDetalleDTO MapBarcoDetalle(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BarcoDetalleDTO Obj = new BarcoDetalleDTO();
            Obj.CodBarco = Convert.ToInt32(reader["CodBarco"]);
            Obj.Linea = Convert.ToInt32(reader["Linea"]);
            Obj.CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]);
            Obj.IdSuplidor = ObjEncriptacion.Encriptar(Obj.CodSuplidor.ToString());
            Obj.Suplidor = reader["Suplidor"].ToString() ?? "";
            Obj.CodProducto = Convert.ToInt32(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.Cantidad = Convert.ToDecimal(reader["Cantidad"]);
            return Obj;
        }

        private BarcoDTO MapBarcoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BarcoDTO Obj = MapBarco(reader);
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

        private string SqlNumero(decimal valor)
        {
            return valor.ToString(CultureInfo.InvariantCulture);
        }

        private string SqlFecha(DateTime? valor)
        {
            if (!valor.HasValue)
                return "NULL";

            return "'" + valor.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture) + "'";
        }
    }
}




