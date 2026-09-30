using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Globalization;
using System.Text;

namespace app.Models.IngresoBarco
{
    /// <summary>
    /// DAO para el registro de ingresos de barco.
    /// </summary>
    internal class IngresoBarcoDAO
    {
        private readonly DAL ObjDAL = new DAL();

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
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

        internal PaginacionResultado<IngresoBarcoDetalleDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<IngresoBarcoDetalleDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0) totalCount = PaginacionSql.LeerTotal(reader);
                return new IngresoBarcoDetalleDTO
                {
                    CodIngresoBarco = Convert.ToInt32(reader["CodIngresoBarco"]),
                    Linea = Convert.ToInt32(reader["Linea"]),
                    Suplidor = reader["Suplidor"].ToString() ?? "",
                    Producto = reader["Producto"].ToString() ?? "",
                    CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]),
                    CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"]),
                    FechaIngreso = reader["FechaIngreso"] == DBNull.Value ? null : Convert.ToDateTime(reader["FechaIngreso"]),
                    CodigoInterno = reader["CodigoInterno"].ToString() ?? "",
                    Barco = reader["Barco"].ToString() ?? ""
                };
            });
            return new PaginacionResultado<IngresoBarcoDetalleDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal IngresoBarcoDTO Obtener(int codigo)
        {
            IngresoBarcoDTO ingreso = ObjDAL.EjecutarReader(
                "SELECT [CodIngresoBarco],[CodBarco],[FechaIngreso],[CodigoInterno],[CorrelativoOTSA] FROM IngresoBarco WHERE [CodIngresoBarco]='" + codigo + "'",
                reader => new IngresoBarcoDTO
                {
                    CodIngresoBarco = Convert.ToInt32(reader["CodIngresoBarco"]),
                    CodBarco = Convert.ToInt32(reader["CodBarco"]),
                    FechaIngreso = reader["FechaIngreso"] == DBNull.Value ? null : Convert.ToDateTime(reader["FechaIngreso"]),
                    CodigoInterno = reader["CodigoInterno"].ToString() ?? "",
                    CorrelativoOTSA = reader["CorrelativoOTSA"].ToString() ?? ""
                }).FirstOrDefault() ?? new IngresoBarcoDTO();

            if (ingreso.CodIngresoBarco > 0)
                ingreso.Detalles = ObjDAL.EjecutarReader(QueryDetalles(ingreso.CodIngresoBarco), reader => new IngresoBarcoDetalleDTO
                {
                    CodIngresoBarco = Convert.ToInt32(reader["CodIngresoBarco"]),
                    Linea = Convert.ToInt32(reader["Linea"]),
                    CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]),
                    CodProducto = Convert.ToInt32(reader["CodProducto"]),
                    CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]),
                    CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"])
                });

            return ingreso;
        }

        internal MsjDB Agregar(IngresoBarcoDTO Obj)
        {
            Obj.CodIngresoBarco = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararIngreso(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("IngresoBarco", "CREADO", "CodIngresoBarco:" + Obj.CodIngresoBarco, Nuevo: Obj);
                AutorizacionDocumentos.RegistrarPendiente((int)Menus.IngresoBarco, Obj.CodIngresoBarco);
            }

            return msjDB;
        }

        internal MsjDB Editar(IngresoBarcoDTO Obj)
        {
            IngresoBarcoDTO anterior = Obtener(Obj.CodIngresoBarco);
            if (anterior.CodIngresoBarco <= 0)
                return Error("Ingreso de barco no encontrado.");
            if (!AutorizacionDocumentos.HayAutorizador((int)Menus.IngresoBarco))
            {
                Obj.Version = ObjDAL.EjecutarScalar("SELECT ISNULL(MAX(A.[Version]),0)+1 AS [Version] FROM (SELECT * FROM IngresoBarco_LOG UNION ALL SELECT * FROM IngresoBarco) A WHERE A.[CodIngresoBarco]='" + Obj.CodIngresoBarco + "'", 1);
                Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
                MsjDB validacionDirecta = PrepararIngreso(Obj);
                if (!validacionDirecta.Estatus) return validacionDirecta;
                return ObjDAL.Ejecutar(QueryEditar(Obj), Key: false, tipoDAL: TipoDAL.Editar);
            }
            int codigoOriginal = Obj.CodIngresoBarco;
            int codigoTemporal = -codigoOriginal;
            if (ObjDAL.EjecutarExiste("SELECT 1 FROM IngresoBarco WHERE CodIngresoBarco='" + codigoTemporal + "'"))
                return Error("Ya existe una edición pendiente de autorización para este ingreso de barco.");

            Obj.CodIngresoBarco = codigoTemporal;
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB validacion = PrepararIngreso(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(QueryAgregar(Obj), Key: false, tipoDAL: TipoDAL.Agregar);
            if (msjDB.Estatus)
            {
                AutorizacionDocumentos.RegistrarPendiente((int)Menus.IngresoBarco, codigoTemporal);
                LogModificacionDAO.Registrar("IngresoBarco", "EDICION_PENDIENTE", "CodIngresoBarco:" + codigoOriginal, Anterior: anterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, IngresoBarcoDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return QueryAgregar(Obj!);
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodIngresoBarco]),0)+1 as 'CodIngresoBarco' FROM IngresoBarco A ";
                default:
                    return "";
            }
        }

        private MsjDB PrepararIngreso(IngresoBarcoDTO Obj)
        {
            Obj.CodigoInterno = (Obj.CodigoInterno ?? "").Trim();
            Obj.CorrelativoOTSA = (Obj.CorrelativoOTSA ?? "").Trim();

            if (Obj.CodBarco <= 0)
                return Error("El barco es requerido.");

            if (!Obj.FechaIngreso.HasValue)
                return Error("La fecha de ingreso es requerida.");

            if (string.IsNullOrWhiteSpace(Obj.CodigoInterno))
                return Error("El codigo interno es requerido.");

            if (!BarcoExiste(Obj.CodBarco))
                return Error("El barco seleccionado no existe.");

            if (Obj.Detalles == null || Obj.Detalles.Count == 0)
                return Error("Debe agregar al menos una fila al detalle del ingreso.");

            Obj.FechaIngreso = Obj.FechaIngreso.Value.Date;

            for (int index = 0; index < Obj.Detalles.Count; index++)
            {
                IngresoBarcoDetalleDTO detalle = Obj.Detalles[index];
                detalle.CodIngresoBarco = Obj.CodIngresoBarco;
                detalle.Linea = index + 1;
                detalle.CantidadAmbiente = 0;

                if (detalle.CodSuplidor <= 0)
                    return Error("El suplidor es requerido en todas las filas.");

                if (detalle.CodProducto <= 0)
                    return Error("El producto es requerido en todas las filas.");

                if (detalle.CantidadEstandar <= 0)
                    return Error("La cantidad estandar debe ser mayor a cero en todas las filas.");

                if (!SocioExiste(detalle.CodSuplidor))
                    return Error("Uno de los suplidores seleccionados no existe.");

                if (!ProductoEsCombustible(detalle.CodProducto))
                    return Error("Los productos seleccionados deben ser de tipo combustible.");
            }

            return Ok();
        }

        private string QueryAgregar(IngresoBarcoDTO Obj)
        {
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("INSERT INTO IngresoBarco (CodIngresoBarco,CodBarco,FechaIngreso,CodigoInterno,CorrelativoOTSA,Version,CodUsuarioCreacion,FechaCreacion) VALUES('");
            query.Append(Obj.CodIngresoBarco).Append("','");
            query.Append(Obj.CodBarco).Append("',");
            query.Append(SqlFecha(Obj.FechaIngreso)).Append(",'");
            query.Append(SqlTexto(Obj.CodigoInterno)).Append("','");
            query.Append(SqlTexto(Obj.CorrelativoOTSA)).Append("','");
            query.Append(Obj.Version).Append("','");
            query.Append(SqlTexto(Obj.CodUsuarioCreacion)).Append("',GETDATE()); ");
            query.Append(QueryInsertarDetalles(Obj));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryEditar(IngresoBarcoDTO Obj)
        {
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("UPDATE IngresoBarco SET CodBarco='").Append(Obj.CodBarco).Append("',FechaIngreso=");
            query.Append(SqlFecha(Obj.FechaIngreso)).Append(",CodigoInterno='").Append(SqlTexto(Obj.CodigoInterno));
            query.Append("',CorrelativoOTSA='").Append(SqlTexto(Obj.CorrelativoOTSA));
            query.Append("',Version=").Append(Obj.Version).Append(",CodUsuarioActualizacion='");
            query.Append(SqlTexto(Obj.CodUsuarioActualizacion)).Append("',FechaActualizacion=GETDATE() WHERE CodIngresoBarco='");
            query.Append(Obj.CodIngresoBarco).Append("'; DELETE FROM IngresoBarcoDetalle WHERE CodIngresoBarco='");
            query.Append(Obj.CodIngresoBarco).Append("'; ").Append(QueryInsertarDetalles(Obj));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryInsertarDetalles(IngresoBarcoDTO Obj)
        {
            if (Obj.Detalles.Count == 0)
                return "";

            List<string> values = Obj.Detalles.Select(detalle =>
                "('" + Obj.CodIngresoBarco + "','" + detalle.Linea + "','" + detalle.CodSuplidor + "','" + detalle.CodProducto + "'," + SqlNumero(detalle.CantidadEstandar) + "," + SqlNumero(detalle.CantidadAmbiente) + ")"
            ).ToList();

            return "INSERT INTO IngresoBarcoDetalle (CodIngresoBarco,Linea,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente) VALUES "
                + string.Join(",", values) + "; ";
        }

        private bool BarcoExiste(int CodBarco)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Barco A WHERE A.[CodBarco]='" + CodBarco + "'");
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

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> columnas = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["fecha"] = "I.[FechaIngreso]",
                ["barco"] = "B.[Barco]",
                ["suplidor"] = "S.[Suplidor]",
                ["producto"] = "P.[Producto]"
            };
            string where = "WHERE I.[CodIngresoBarco] > 0 " + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
            {
                "CONVERT(VARCHAR(20), I.[CodIngresoBarco])",
                "CONVERT(VARCHAR(10), I.[FechaIngreso], 103)",
                "I.[CodigoInterno]",
                "B.[Barco]",
                "S.[Suplidor]",
                "P.[Producto]"
            });
            return "SELECT I.[CodIngresoBarco], D.[Linea], I.[FechaIngreso], I.[CodigoInterno], ISNULL(B.[Barco], '') AS [Barco], ISNULL(S.[Suplidor], '') AS [Suplidor], ISNULL(P.[Producto], '') AS [Producto], D.[CantidadEstandar], D.[CantidadAmbiente], COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] FROM IngresoBarco I INNER JOIN IngresoBarcoDetalle D ON I.[CodIngresoBarco] = D.[CodIngresoBarco] LEFT JOIN Barco B ON I.[CodBarco] = B.[CodBarco] LEFT JOIN Suplidor S ON D.[CodSuplidor] = S.[CodSuplidor] LEFT JOIN Producto P ON D.[CodProducto] = P.[CodProducto] " + where + "ORDER BY " + PaginacionSql.OrderBy(paginacion.Sort, columnas, "I.[FechaIngreso] DESC, I.[CodIngresoBarco] DESC, D.[Linea]") + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryDetalles(int codigo)
        {
            return "SELECT [CodIngresoBarco],[Linea],[CodSuplidor],[CodProducto],[CantidadEstandar],[CantidadAmbiente] FROM IngresoBarcoDetalle WHERE [CodIngresoBarco]='" + codigo + "' ORDER BY [Linea]";
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

        private string SqlFecha(DateTime? valor)
        {
            if (!valor.HasValue)
                return "NULL";

            return "'" + valor.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture) + "'";
        }

        private string SqlNumero(decimal valor)
        {
            return valor.ToString(CultureInfo.InvariantCulture);
        }
    }
}


