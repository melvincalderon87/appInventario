using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Globalization;
using System.Text;

namespace app.Models.CompraVentaSuplidores
{
    /// <summary>
    /// DAO para el mantenimiento de traslados de producto entre suplidores.
    /// </summary>
    internal class CompraVentaSuplidoresDAO
    {
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<CompraVentaSuplidoresDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<CompraVentaSuplidoresDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapTraslado(reader);
            });

            return new PaginacionResultado<CompraVentaSuplidoresDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal CompraVentaSuplidoresDTO Obtener(int CodCompraVentaSuplidores)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodCompraVentaSuplidores), MapTraslado).FirstOrDefault() ?? new CompraVentaSuplidoresDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal List<SelectListItem> ListarProductosCombustible()
        {
            const string query = "SELECT P.[CodProducto], P.[Producto] FROM Producto P "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE UPPER(TP.[Descripcion]) = UPPER('Combustible') ORDER BY P.[Producto]";
            return ObjDAL.EjecutarReader(query, reader => new SelectListItem
            {
                Value = reader["CodProducto"].ToString(),
                Text = reader["Producto"].ToString()
            });
        }

        internal MsjDB Agregar(CompraVentaSuplidoresDTO Obj)
        {
            Obj.CodCompraVentaSuplidores = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararTraslado(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CompraVentaSuplidores", "CREADO", "CodCompraVentaSuplidores:" + Obj.CodCompraVentaSuplidores, Nuevo: Obj);
                AutorizacionDocumentos.RegistrarPendiente((int)Menus.CompraVentaSuplidores, Obj.CodCompraVentaSuplidores);
            }

            return msjDB;
        }

        internal MsjDB Editar(CompraVentaSuplidoresDTO Obj)
        {
            CompraVentaSuplidoresDTO ObjAnterior = Obtener(Obj.CodCompraVentaSuplidores);
            if (ObjAnterior.CodCompraVentaSuplidores <= 0)
                return Error("Compra o venta a suplidor no encontrada.");

            Obj.Version = ObtenerVersion(Obj.CodCompraVentaSuplidores);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararTraslado(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CompraVentaSuplidores", "EDITADO", "CodCompraVentaSuplidores:" + Obj.CodCompraVentaSuplidores, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Eliminar(CompraVentaSuplidoresDTO Obj)
        {
            CompraVentaSuplidoresDTO ObjAnterior = Obtener(Obj.CodCompraVentaSuplidores);
            if (ObjAnterior.CodCompraVentaSuplidores <= 0)
                return Error("Compra o venta a suplidor no encontrada.");

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CompraVentaSuplidores", "ELIMINADO", "CodCompraVentaSuplidores:" + Obj.CodCompraVentaSuplidores, Anterior: ObjAnterior);
            }

            return msjDB;
        }

        internal int ObtenerVersion(int CodCompraVentaSuplidores)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodCompraVentaSuplidores), 1);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, CompraVentaSuplidoresDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return QueryAgregar(Obj!);
                case TipoDAL.Editar:
                    return QueryEditar(Obj!);
                case TipoDAL.Eliminar:
                    return "DELETE FROM CompraVentaSuplidoresCombustible WHERE CodCompraVentaSuplidoresCombustible='" + Obj!.CodCompraVentaSuplidores + "'";
                case TipoDAL.Listado:
                    return SelectBase();
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodCompraVentaSuplidoresCombustible]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodCompraVentaSuplidoresCombustible]),0)+1 as 'CodCompraVentaSuplidores' FROM CompraVentaSuplidoresCombustible A";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' "
                        + "FROM (SELECT [CodCompraVentaSuplidoresCombustible] AS [CodCompraVentaSuplidores],[Version] FROM CompraVentaSuplidoresCombustible_LOG UNION ALL SELECT [CodCompraVentaSuplidoresCombustible] AS [CodCompraVentaSuplidores],[Version] FROM CompraVentaSuplidoresCombustible) A "
                        + "WHERE A.[CodCompraVentaSuplidores]='" + CodKey + "'";
                default:
                    return "";
            }
        }

        private MsjDB PrepararTraslado(CompraVentaSuplidoresDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return Error("La fecha es requerida.");

            if (Obj.CodSuplidorOrigen <= 0)
                return Error("El suplidor origen es requerido.");

            if (Obj.CodSuplidorDestino <= 0)
                return Error("El suplidor destino es requerido.");

            if (Obj.CodSuplidorOrigen == Obj.CodSuplidorDestino)
                return Error("El suplidor origen y el suplidor destino deben ser diferentes.");

            if (Obj.CodProducto <= 0)
                return Error("El producto es requerido.");

            if (Obj.CantidadEstandar <= 0)
                return Error("La cantidad estandar debe ser mayor a cero.");

            if (Obj.CantidadAmbiente <= 0)
                return Error("La cantidad ambiente debe ser mayor a cero.");

            if (!SocioExiste(Obj.CodSuplidorOrigen))
                return Error("El suplidor origen seleccionado no existe.");

            if (!SocioExiste(Obj.CodSuplidorDestino))
                return Error("El suplidor destino seleccionado no existe.");

            if (!ProductoEsCombustible(Obj.CodProducto))
                return Error("El producto seleccionado debe ser de tipo combustible.");

            Obj.Fecha = Obj.Fecha.Value.Date;

            return Ok();
        }

        private string SelectBase()
        {
            return "SELECT A.[CodCompraVentaSuplidoresCombustible] AS [CodCompraVentaSuplidores],A.[Fecha],"
                + "A.[CodSuplidorOrigen],ISNULL(SO.[Suplidor], '') AS [SuplidorOrigen],"
                + "A.[CodSuplidorDestino],ISNULL(SD.[Suplidor], '') AS [SuplidorDestino],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CantidadEstandar],A.[CantidadAmbiente],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM CompraVentaSuplidoresCombustible A "
                + "LEFT JOIN Suplidor SO ON A.[CodSuplidorOrigen] = SO.[CodSuplidor] "
                + "LEFT JOIN Suplidor SD ON A.[CodSuplidorDestino] = SD.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codCompraVentaSuplidores"] = "A.[CodCompraVentaSuplidoresCombustible]",
                ["fecha"] = "A.[Fecha]",
                ["suplidorOrigen"] = "SO.[Suplidor]",
                ["suplidorDestino"] = "SD.[Suplidor]",
                ["producto"] = "P.[Producto]",
                ["cantidadEstandar"] = "A.[CantidadEstandar]",
                ["cantidadAmbiente"] = "A.[CantidadAmbiente]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodCompraVentaSuplidoresCombustible])",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "SO.[Suplidor]",
                    "SD.[Suplidor]",
                    "P.[Producto]",
                    "CONVERT(VARCHAR(30), A.[CantidadEstandar])",
                    "CONVERT(VARCHAR(30), A.[CantidadAmbiente])",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodCompraVentaSuplidoresCombustible] DESC");

            return "SELECT A.[CodCompraVentaSuplidoresCombustible] AS [CodCompraVentaSuplidores],A.[Fecha],"
                + "A.[CodSuplidorOrigen],ISNULL(SO.[Suplidor], '') AS [SuplidorOrigen],"
                + "A.[CodSuplidorDestino],ISNULL(SD.[Suplidor], '') AS [SuplidorDestino],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CantidadEstandar],A.[CantidadAmbiente],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM CompraVentaSuplidoresCombustible A "
                + "LEFT JOIN Suplidor SO ON A.[CodSuplidorOrigen] = SO.[CodSuplidor] "
                + "LEFT JOIN Suplidor SD ON A.[CodSuplidorDestino] = SD.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryAgregar(CompraVentaSuplidoresDTO Obj)
        {
            StringBuilder query = new StringBuilder();
            query.Append("INSERT INTO CompraVentaSuplidoresCombustible (CodCompraVentaSuplidoresCombustible,Fecha,CodSuplidorOrigen,CodSuplidorDestino,CodProducto,CantidadEstandar,CantidadAmbiente,Estatus,Version,CodUsuarioCreacion,FechaCreacion) VALUES(");
            query.Append(Obj.CodCompraVentaSuplidores).Append(",");
            query.Append(SqlFecha(Obj.Fecha)).Append(",");
            query.Append(Obj.CodSuplidorOrigen).Append(",");
            query.Append(Obj.CodSuplidorDestino).Append(",");
            query.Append(Obj.CodProducto).Append(",");
            query.Append(SqlNumero(Obj.CantidadEstandar)).Append(",");
            query.Append(SqlNumero(Obj.CantidadAmbiente)).Append(",");
            query.Append(SqlBit(Obj.Estatus)).Append(",");
            query.Append(Obj.Version).Append(",'");
            query.Append(SqlTexto(Obj.CodUsuarioCreacion)).Append("',GETDATE())");
            return query.ToString();
        }

        private string QueryEditar(CompraVentaSuplidoresDTO Obj)
        {
            return "UPDATE CompraVentaSuplidoresCombustible SET "
                + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                + "CodSuplidorOrigen=" + Obj.CodSuplidorOrigen + ","
                + "CodSuplidorDestino=" + Obj.CodSuplidorDestino + ","
                + "CodProducto=" + Obj.CodProducto + ","
                + "CantidadEstandar=" + SqlNumero(Obj.CantidadEstandar) + ","
                + "CantidadAmbiente=" + SqlNumero(Obj.CantidadAmbiente) + ","
                + "Estatus=" + SqlBit(Obj.Estatus) + ","
                + "Version=" + Obj.Version + ","
                + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                + "FechaActualizacion=GETDATE() "
                + "WHERE CodCompraVentaSuplidoresCombustible=" + Obj.CodCompraVentaSuplidores;
        }

        private CompraVentaSuplidoresDTO MapTraslado(SqlDataReader reader)
        {
            CompraVentaSuplidoresDTO Obj = new CompraVentaSuplidoresDTO();
            Obj.CodCompraVentaSuplidores = Convert.ToInt32(reader["CodCompraVentaSuplidores"]);
            Obj.IdCompraVentaSuplidores = ObjEncriptacion.Encriptar(Obj.CodCompraVentaSuplidores.ToString());
            Obj.Fecha = reader["Fecha"] == DBNull.Value ? null : Convert.ToDateTime(reader["Fecha"]);
            Obj.CodSuplidorOrigen = Convert.ToInt32(reader["CodSuplidorOrigen"]);
            Obj.IdSuplidorOrigen = ObjEncriptacion.Encriptar(Obj.CodSuplidorOrigen.ToString());
            Obj.SuplidorOrigen = reader["SuplidorOrigen"].ToString() ?? "";
            Obj.CodSuplidorDestino = Convert.ToInt32(reader["CodSuplidorDestino"]);
            Obj.IdSuplidorDestino = ObjEncriptacion.Encriptar(Obj.CodSuplidorDestino.ToString());
            Obj.SuplidorDestino = reader["SuplidorDestino"].ToString() ?? "";
            Obj.CodProducto = Convert.ToInt32(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]);
            Obj.CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"]);
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private bool SocioExiste(int CodSuplidor)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Suplidor A WHERE A.[CodSuplidor]='" + CodSuplidor + "'");
        }

        private bool ProductoEsCombustible(int CodProducto)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Producto P INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE P.[CodProducto]='" + CodProducto + "' AND UPPER(TP.[Descripcion]) = UPPER('Combustible')");
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

        private string SqlBit(bool valor)
        {
            return valor ? "1" : "0";
        }
    }
}
