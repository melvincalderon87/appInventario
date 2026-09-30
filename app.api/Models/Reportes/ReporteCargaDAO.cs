using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.Reportes
{
    /// <summary>Acceso a datos del modulo Reportes.</summary>
    internal class ReporteCargaDAO
    {
        private readonly DAL dal = new();

        internal Task<List<ReporteCargaDTO>> ListarCargaEstandarAsync(
            DateTime fechaInicial,
            DateTime fechaFinal,
            CancellationToken cancellationToken)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "SELECT CONVERT(DATE, F.[FechaHoraUltimaCarga]) AS [FechaCarga], "
                + "CONCAT(T.[FolioAnio], '-', T.[FolioMes], '-', T.[Folio]) AS [Folio], "
                + "ISNULL(CONVERT(VARCHAR(50), T.[IdCliente]), '') AS [CodCliente], "
                + "ISNULL(T.[Cliente], '') AS [Cliente], ISNULL(T.[Unidad], '') AS [Unidad], "
                + "ISNULL(T.[Piloto], '') AS [Piloto], ISNULL(NULLIF(T.[ProductoSocio], ''), ISNULL(T.[ProductoBase], '')) AS [ProductoTms], "
                + "CASE WHEN NULLIF(T.[Cantidad], 0) IS NULL THEN 0 ELSE ISNULL(T.[Importe], 0) / T.[Cantidad] END AS [Factor], "
                + "COALESCE(TRY_CONVERT(DECIMAL(18, 8), T.[VCF]), 0) AS [Vcf], ISNULL(T.[Importe], 0) AS [CantidadCargada] "
                + "FROM [BI].dbo.[TMS] T "
                + "INNER JOIN [BI].dbo.[FolioTms] F ON F.[FolioAnio] = T.[FolioAnio] "
                + "AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio] "
                + "WHERE F.[FechaHoraUltimaCarga] >= '" + inicio + "' "
                + "AND F.[FechaHoraUltimaCarga] < DATEADD(DAY, 1, '" + fin + "') AND EXISTS (SELECT 1 FROM [BI].dbo.[TMS_Datos] TD WHERE TD.[IdTransaccion] = 530 AND TD.[IdSecuenciaSalida] = T.[IdSecuenciaSalida] AND TD.[IdRecord] = T.[IdRecord] AND TD.[FolioAnio] = T.[FolioAnio] AND TD.[FolioMes] = T.[FolioMes] AND TD.[Folio] = T.[Folio] AND TD.[NoOrden] = T.[NoOrden] AND TD.[IdProductoSocio] = T.[IdProductoSocio] AND TD.[IdProductoBase] = T.[IdProductoBase]) "
                + "ORDER BY F.[FechaHoraUltimaCarga], T.[IdCliente], T.[NoOrden], T.[IdRecord]";
            return dal.EjecutarReaderAsync(consulta, Map, cancellationToken);
        }

        internal Task<List<ReporteCargaDTO>> ListarCargaAmbienteAsync(
            DateTime fechaInicial,
            DateTime fechaFinal,
            CancellationToken cancellationToken)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "SELECT CONVERT(DATE, F.[FechaHoraUltimaCarga]) AS [FechaCarga], "
                + "CONCAT(T.[FolioAnio], '-', T.[FolioMes], '-', T.[Folio]) AS [Folio], "
                + "ISNULL(CONVERT(VARCHAR(50), T.[IdCliente]), '') AS [CodCliente], "
                + "ISNULL(T.[Cliente], '') AS [Cliente], ISNULL(T.[Unidad], '') AS [Unidad], "
                + "ISNULL(T.[Piloto], '') AS [Piloto], ISNULL(NULLIF(T.[ProductoSocio], ''), ISNULL(T.[ProductoBase], '')) AS [ProductoTms], "
                + "CASE WHEN NULLIF(T.[Cantidad], 0) IS NULL THEN 0 ELSE ISNULL(T.[Importe], 0) / T.[Cantidad] END AS [Factor], "
                + "COALESCE(TRY_CONVERT(DECIMAL(18, 8), T.[VCF]), 0) AS [Vcf], ISNULL(T.[Cantidad], 0) AS [CantidadCargada] "
                + "FROM [BI].dbo.[TMS] T "
                + "INNER JOIN [BI].dbo.[FolioTms] F ON F.[FolioAnio] = T.[FolioAnio] "
                + "AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio] "
                + "WHERE F.[FechaHoraUltimaCarga] >= '" + inicio + "' "
                + "AND F.[FechaHoraUltimaCarga] < DATEADD(DAY, 1, '" + fin + "') AND EXISTS (SELECT 1 FROM [BI].dbo.[TMS_Datos] TD WHERE TD.[IdTransaccion] = 530 AND TD.[IdSecuenciaSalida] = T.[IdSecuenciaSalida] AND TD.[IdRecord] = T.[IdRecord] AND TD.[FolioAnio] = T.[FolioAnio] AND TD.[FolioMes] = T.[FolioMes] AND TD.[Folio] = T.[Folio] AND TD.[NoOrden] = T.[NoOrden] AND TD.[IdProductoSocio] = T.[IdProductoSocio] AND TD.[IdProductoBase] = T.[IdProductoBase]) "
                + "ORDER BY F.[FechaHoraUltimaCarga], T.[IdCliente], T.[NoOrden], T.[IdRecord]";
            return dal.EjecutarReaderAsync(consulta, Map, cancellationToken);
        }

        internal List<ReporteIngresoBarcoDTO> ListarIngresosBarco(DateTime fechaInicial, DateTime fechaFinal, bool ambiente)
        {
            string inicio = fechaInicial.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            string cantidad = ambiente ? "D.[CantidadAmbiente]" : "D.[CantidadEstandar]";
            string consulta = "SELECT I.[FechaIngreso], CONVERT(VARCHAR(50), I.[CodIngresoBarco]) AS [CodigoIngreso], ISNULL(B.[Barco], '') AS [Barco], ISNULL(I.[CodigoInterno], '') AS [CodigoInterno], ISNULL(S.[Suplidor], '') AS [Suplidor], ISNULL(P.[Producto], '') AS [Producto], COALESCE(TRY_CONVERT(DECIMAL(18, 6), " + cantidad + "), 0) AS [CantidadCargada] FROM IngresoBarco I INNER JOIN IngresoBarcoDetalle D ON D.[CodIngresoBarco] = I.[CodIngresoBarco] LEFT JOIN Barco B ON B.[CodBarco] = I.[CodBarco] LEFT JOIN Suplidor S ON S.[CodSuplidor] = D.[CodSuplidor] LEFT JOIN Producto P ON P.[CodProducto] = D.[CodProducto] WHERE I.[Estatus] = 1 AND D.[Estatus] = 1 AND I.[FechaIngreso] >= '" + inicio + "' AND I.[FechaIngreso] < DATEADD(DAY, 1, '" + fin + "') ORDER BY I.[FechaIngreso], I.[CodIngresoBarco], D.[Linea]";
            return dal.EjecutarReader(consulta, reader => new ReporteIngresoBarcoDTO { FechaIngreso = Convert.ToDateTime(reader["FechaIngreso"]), CodigoIngreso = reader["CodigoIngreso"].ToString() ?? "", Barco = reader["Barco"].ToString() ?? "", CodigoInterno = reader["CodigoInterno"].ToString() ?? "", Suplidor = reader["Suplidor"].ToString() ?? "", Producto = reader["Producto"].ToString() ?? "", CantidadCargada = Convert.ToDecimal(reader["CantidadCargada"]) });
        }

        internal Task<List<ReporteIngresoBarcoDTO>> ListarIngresosBarcoAsync(
            DateTime fechaInicial,
            DateTime fechaFinal,
            bool ambiente,
            CancellationToken cancellationToken)
        {
            string inicio = fechaInicial.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            string cantidad = ambiente ? "D.[CantidadAmbiente]" : "D.[CantidadEstandar]";
            string consulta = "SELECT I.[FechaIngreso], CONVERT(VARCHAR(50), I.[CodIngresoBarco]) AS [CodigoIngreso], ISNULL(B.[Barco], '') AS [Barco], ISNULL(I.[CodigoInterno], '') AS [CodigoInterno], ISNULL(S.[Suplidor], '') AS [Suplidor], ISNULL(P.[Producto], '') AS [Producto], COALESCE(TRY_CONVERT(DECIMAL(18, 6), " + cantidad + "), 0) AS [CantidadCargada] FROM IngresoBarco I INNER JOIN IngresoBarcoDetalle D ON D.[CodIngresoBarco] = I.[CodIngresoBarco] LEFT JOIN Barco B ON B.[CodBarco] = I.[CodBarco] LEFT JOIN Suplidor S ON S.[CodSuplidor] = D.[CodSuplidor] LEFT JOIN Producto P ON P.[CodProducto] = D.[CodProducto] WHERE I.[Estatus] = 1 AND D.[Estatus] = 1 AND I.[FechaIngreso] >= '" + inicio + "' AND I.[FechaIngreso] < DATEADD(DAY, 1, '" + fin + "') ORDER BY I.[FechaIngreso], I.[CodIngresoBarco], D.[Linea]";
            return dal.EjecutarReaderAsync(consulta, reader => new ReporteIngresoBarcoDTO { FechaIngreso = Convert.ToDateTime(reader["FechaIngreso"]), CodigoIngreso = reader["CodigoIngreso"].ToString() ?? "", Barco = reader["Barco"].ToString() ?? "", CodigoInterno = reader["CodigoInterno"].ToString() ?? "", Suplidor = reader["Suplidor"].ToString() ?? "", Producto = reader["Producto"].ToString() ?? "", CantidadCargada = Convert.ToDecimal(reader["CantidadCargada"]) }, cancellationToken);
        }

        internal bool ExistenIngresosBarco(DateTime fechaInicial, DateTime fechaFinal)
        {
            string inicio = fechaInicial.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            string consulta = "SELECT CASE WHEN EXISTS (SELECT 1 FROM IngresoBarco I INNER JOIN IngresoBarcoDetalle D ON D.[CodIngresoBarco] = I.[CodIngresoBarco] WHERE I.[Estatus] = 1 AND D.[Estatus] = 1 AND I.[FechaIngreso] >= '" + inicio + "' AND I.[FechaIngreso] < DATEADD(DAY, 1, '" + fin + "')) THEN 1 ELSE 0 END";
            return dal.EjecutarScalar<int>(consulta) == 1;
        }

        private static ReporteCargaDTO Map(SqlDataReader reader) => new()
        {
            FechaCarga = Convert.ToDateTime(reader["FechaCarga"]),
            Folio = reader["Folio"].ToString() ?? "",
            CodCliente = reader["CodCliente"].ToString() ?? "",
            Cliente = reader["Cliente"].ToString() ?? "",
            Unidad = reader["Unidad"].ToString() ?? "",
            Piloto = reader["Piloto"].ToString() ?? "",
            ProductoTms = reader["ProductoTms"].ToString() ?? "",
            Factor = Convert.ToDecimal(reader["Factor"]),
            Vcf = Convert.ToDecimal(reader["Vcf"]),
            CantidadCargada = Convert.ToDecimal(reader["CantidadCargada"])
        };
    }
}
