using app.Models.Producto;
using app.Models.Paginacion;
using app.Models.Suplidor;

namespace app.Models.Ventas
{
    /// <summary>Acceso a datos del modulo Venta.</summary>
    internal class VentaDAO
    {
        private readonly DAL dal = new DAL();
        private readonly Encriptacion encriptacion = new Encriptacion();

        internal PaginacionResultado<VentaDTO> Listado(string codUsuario, int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<VentaDTO> items = dal.EjecutarReader(
                "SELECT V.CodVenta,V.Periodo,V.CodSuplidor,S.Suplidor,V.CodProducto,P.Producto,V.CodUsuario,SUM(VD.CantidadEstandar) AS Total,COUNT(1) OVER() AS " + PaginacionSql.TotalRegistrosAlias + " "
                + "FROM Venta V INNER JOIN Suplidor S ON S.CodSuplidor=V.CodSuplidor INNER JOIN Producto P ON P.CodProducto=V.CodProducto "
                + "INNER JOIN VentaDetalle VD ON VD.CodVenta=V.CodVenta WHERE 1=1 " + FiltroSuplidorUsuario(codUsuario, "V")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[] { "S.Suplidor", "P.Producto", "CONVERT(VARCHAR(10), V.Periodo, 23)" })
                + "GROUP BY V.CodVenta,V.Periodo,V.CodSuplidor,S.Suplidor,V.CodProducto,P.Producto,V.CodUsuario "
                + "ORDER BY " + OrdenListado(paginacion.Sort) + PaginacionSql.OffsetFetch(paginacion), reader =>
                {
                    if (totalCount == 0) totalCount = PaginacionSql.LeerTotal(reader);
                    return MapVenta(reader);
                });

            return new PaginacionResultado<VentaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal VentaDTO Obtener(int codVenta, string codUsuario)
        {
            VentaDTO venta = dal.EjecutarReader(
                "SELECT TOP 1 V.CodVenta,V.Periodo,V.CodSuplidor,S.Suplidor,V.CodProducto,P.Producto,V.CodUsuario,ISNULL(SUM(VD.CantidadEstandar),0) AS Total "
                + "FROM Venta V INNER JOIN Suplidor S ON S.CodSuplidor=V.CodSuplidor INNER JOIN Producto P ON P.CodProducto=V.CodProducto "
                + "LEFT JOIN VentaDetalle VD ON VD.CodVenta=V.CodVenta WHERE V.CodVenta=" + codVenta + FiltroSuplidorUsuario(codUsuario, "V") + " "
                + "GROUP BY V.CodVenta,V.Periodo,V.CodSuplidor,S.Suplidor,V.CodProducto,P.Producto,V.CodUsuario", MapVenta).FirstOrDefault() ?? new VentaDTO();
            if (venta.CodVenta > 0)
                venta.Detalles = dal.EjecutarReader("SELECT Dia,CantidadEstandar,CantidadAmbiente FROM VentaDetalle WHERE CodVenta=" + codVenta + " ORDER BY Dia", r => new VentaDetalleDTO { Dia = Convert.ToInt32(r["Dia"]), CantidadEstandar = Convert.ToDecimal(r["CantidadEstandar"]), CantidadAmbiente = Convert.ToDecimal(r["CantidadAmbiente"]) });
            return venta;
        }

        internal MsjDB Agregar(VentaDTO venta, string codUsuario)
        {
            if (venta == null || string.IsNullOrWhiteSpace(venta.CodSuplidor) || string.IsNullOrWhiteSpace(venta.CodProducto)) return Error("El suplidor y el producto son requeridos.");
            DateTime periodo = new DateTime(venta.Periodo.Year, venta.Periodo.Month, 1);
            if (periodo.Year < 2000) return Error("El mes de venta es requerido.");
            int diasMes = DateTime.DaysInMonth(periodo.Year, periodo.Month);
            List<VentaDetalleDTO> detalles = venta.Detalles ?? new List<VentaDetalleDTO>();
            if (detalles.Count != diasMes || detalles.Select(x => x.Dia).Distinct().Count() != diasMes || detalles.Any(x => x.Dia < 1 || x.Dia > diasMes || x.CantidadEstandar < 0 || x.CantidadAmbiente < 0)) return Error("La carga debe incluir cantidades estándar y ambiente no negativas para cada día del mes.");
            if (string.IsNullOrWhiteSpace(new SuplidorDAO().Obtener(venta.CodSuplidor, codUsuario).CodSuplidor)) return Error("No tiene acceso al suplidor seleccionado.");
            if (string.IsNullOrWhiteSpace(new ProductoDAO().Obtener(venta.CodProducto).CodProducto)) return Error("El producto seleccionado no existe.");
            string usuario = Sql(codUsuario); string suplidor = Sql(venta.CodSuplidor); string producto = Sql(venta.CodProducto);
            if (dal.EjecutarExiste("SELECT 1 FROM Venta WHERE CodUsuario=N'" + usuario + "' AND CodSuplidor=N'" + suplidor + "' AND CodProducto=N'" + producto + "' AND Periodo='" + periodo.ToString("yyyyMMdd") + "'")) return Error("Ya existe una carga para este suplidor, producto y mes.");
            string filas = string.Join(",", detalles.OrderBy(x => x.Dia).Select(x => "(@CodVenta," + x.Dia + "," + x.CantidadEstandar.ToString(System.Globalization.CultureInfo.InvariantCulture) + "," + x.CantidadAmbiente.ToString(System.Globalization.CultureInfo.InvariantCulture) + ")"));
            return dal.Ejecutar(
                "DECLARE @CodVenta INT; BEGIN TRANSACTION; BEGIN TRY "
                + "INSERT INTO Venta (Periodo,CodSuplidor,CodProducto,CodUsuario,Version,Estatus,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES ('" + periodo.ToString("yyyyMMdd") + "',N'" + suplidor + "',N'" + producto + "',N'" + usuario + "',1,1,N'" + usuario + "',GETDATE(),'C'); "
                + "SET @CodVenta=SCOPE_IDENTITY(); INSERT INTO VentaDetalle (CodVenta,Dia,CantidadEstandar,CantidadAmbiente,Version,Estatus,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES " + filas.Replace("@CodVenta", "@CodVenta") + "; COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH",
                Key: false, tipoDAL: TipoDAL.Agregar);
        }

        private VentaDTO MapVenta(Microsoft.Data.SqlClient.SqlDataReader r) => new VentaDTO
        {
            CodVenta = Convert.ToInt32(r["CodVenta"]),
            IdVenta = encriptacion.Encriptar(r["CodVenta"].ToString() ?? ""),
            Periodo = Convert.ToDateTime(r["Periodo"]),
            CodSuplidor = r["CodSuplidor"].ToString() ?? "",
            IdSuplidor = encriptacion.Encriptar(r["CodSuplidor"].ToString() ?? ""),
            Suplidor = r["Suplidor"].ToString() ?? "",
            CodProducto = r["CodProducto"].ToString() ?? "",
            IdProducto = encriptacion.Encriptar(r["CodProducto"].ToString() ?? ""),
            Producto = r["Producto"].ToString() ?? "",
            CodUsuario = r["CodUsuario"].ToString() ?? "",
            Total = Convert.ToDecimal(r["Total"])
        };
        private static string Sql(string? value) => (value ?? "").Replace("'", "''");
        // Si el usuario tiene suplidores asignados, sus ventas se limitan a ellos.
        // Sin asignaciones se conserva el acceso total para usuarios existentes.
        private static string FiltroSuplidorUsuario(string codUsuario, string alias)
        {
            string usuario = Sql(codUsuario);
            return " AND (NOT EXISTS (SELECT 1 FROM UsuarioSuplidor US0 WHERE US0.CodUsuario=N'" + usuario + "' AND US0.Estatus=1) "
                + "OR EXISTS (SELECT 1 FROM UsuarioSuplidor US WHERE US.CodUsuario=N'" + usuario + "' AND US.CodSuplidor=" + alias + ".CodSuplidor AND US.Estatus=1))";
        }
        private static string OrdenListado(string sort) => PaginacionSql.OrderBy(sort, new Dictionary<string, string>
        {
            ["periodo"] = "V.Periodo",
            ["suplidor"] = "S.Suplidor",
            ["producto"] = "P.Producto",
            ["total"] = "SUM(VD.CantidadEstandar)"
        }, "V.Periodo DESC,S.Suplidor ASC,P.Producto ASC");
        private static MsjDB Error(string mensaje) => new MsjDB { Estatus = false, Msj = mensaje };
    }
}
