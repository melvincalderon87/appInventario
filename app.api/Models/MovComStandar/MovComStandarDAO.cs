using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.MovComStandar
{
    /// <summary>Acceso a datos del modulo MovComStandar.</summary>
    internal class MovComStandarDAO
    {
        private const int IdTransaccionDespacho = 530;

        // TMS no almacena el tipo de documento. Se valida contra TMS_Datos con la
        // llave completa de la línea para conservar solo despachos, sin duplicarlos.
        private static string FiltroTmsDespacho(string alias)
        {
            return "EXISTS (SELECT 1 FROM [BI].dbo.[TMS_Datos] TD WHERE TD.[IdTransaccion] = " + IdTransaccionDespacho
                + " AND TD.[IdSecuenciaSalida] = " + alias + ".[IdSecuenciaSalida]"
                + " AND TD.[IdRecord] = " + alias + ".[IdRecord]"
                + " AND TD.[FolioAnio] = " + alias + ".[FolioAnio]"
                + " AND TD.[FolioMes] = " + alias + ".[FolioMes]"
                + " AND TD.[Folio] = " + alias + ".[Folio]"
                + " AND TD.[NoOrden] = " + alias + ".[NoOrden]"
                + " AND TD.[IdProductoSocio] = " + alias + ".[IdProductoSocio]"
                + " AND TD.[IdProductoBase] = " + alias + ".[IdProductoBase])";
        }

        private List<MovComStandarFilaDTO> ListarSaldosIniciales(DateTime fechaInicial, bool ambiente = false)
        {
            string campoCantidad = ambiente ? "CantidadAmbiente" : "CantidadEstandar";
            string consulta = "WITH Saldos AS (SELECT A.[CodSuplidor], A.[CodProducto], A.[" + campoCantidad + "] AS [Cantidad], ROW_NUMBER() OVER (PARTITION BY A.[CodSuplidor], A.[CodProducto] ORDER BY A.[Fecha] DESC, A.[CodSaldoInicialCombustible] DESC) AS [Orden] FROM SaldoInicialCombustible A WHERE A.[Estatus] = 1 AND A.[Fecha] <= '" + fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "') SELECT A.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], A.[CodProducto], ISNULL(P.[Producto], '') AS [Producto], A.[Cantidad] FROM Saldos A INNER JOIN Suplidor S ON S.[CodSuplidor] = A.[CodSuplidor] AND S.[Estatus] = 1 INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE A.[Orden] = 1";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarFilaDTO { CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", Inicial = Convert.ToDecimal(reader["Cantidad"], CultureInfo.InvariantCulture) * 42m });
            return filas;
        }

        private List<MovComStandarFilaDTO> ListarSalidasAmbienteNoIncluidas(DateTime fechaInicial, DateTime fechaFinal)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "SELECT S.[CodSuplidor], ISNULL(SU.[Suplidor], '') AS [Suplidor], S.[CodProducto], P.[Producto], SUM(ISNULL(S.[CantidadAmbiente], 0) * 42) AS [OtrasSalidas] FROM Salidas S INNER JOIN Suplidor SU ON SU.[CodSuplidor] = S.[CodSuplidor] AND SU.[Estatus] = 1 INNER JOIN Producto P ON P.[CodProducto] = S.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE S.[Estatus] = 1 AND S.[Fecha] >= '" + inicio + "' AND S.[Fecha] < DATEADD(DAY, 1, '" + fin + "') AND NOT EXISTS (SELECT 1 FROM CompraVentaSuplidoresCombustible C INNER JOIN Producto PC ON PC.[CodProducto] = C.[CodProducto] AND PC.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(PC.[Tipo]))) = 'BASE' WHERE C.[Estatus] = 1 AND C.[CodSuplidorOrigen] = S.[CodSuplidor] AND C.[CodProducto] = S.[CodProducto] AND C.[Fecha] >= '" + inicio + "' AND C.[Fecha] < DATEADD(DAY, 1, '" + fin + "')) GROUP BY S.[CodSuplidor], SU.[Suplidor], S.[CodProducto], P.[Producto]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarFilaDTO { CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", OtrasSalidas = Convert.ToDecimal(reader["OtrasSalidas"], CultureInfo.InvariantCulture) });
            return filas;
        }

        private Dictionary<int, decimal> ListarFisicoTanques(DateTime fechaInicial, DateTime fechaFinal)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "WITH UltimaFecha AS (SELECT MAX(CONVERT(DATE, A.[Fecha])) AS [Fecha] FROM VolumenTanque A WHERE A.[Estatus] = 1 AND A.[Fecha] >= '" + inicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fin + "')) "
                + "SELECT T.[CodProducto], SUM(ISNULL(V.[VolumenEstandar], 0)) AS [FisicoTanques] FROM VolumenTanque V INNER JOIN Tanque T ON T.[CodTanque] = V.[CodTanque] AND T.[Estatus] = 1 CROSS JOIN UltimaFecha U WHERE V.[Estatus] = 1 AND CONVERT(DATE, V.[Fecha]) = U.[Fecha] GROUP BY T.[CodProducto]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); Dictionary<int, decimal> resultado = new();
            while (reader.Read()) resultado[Convert.ToInt32(reader["CodProducto"])] = Convert.ToDecimal(reader["FisicoTanques"], CultureInfo.InvariantCulture);
            return resultado;
        }

        internal List<MovComStandarCompraVentaFilaDTO> ListarCompraVentaSuplidores(DateTime fechaInicial, DateTime fechaFinal)
        {
            string consulta = "SELECT A.[CodCompraVentaSuplidoresCombustible] AS [Codigo], A.[Fecha], A.[CodSuplidorOrigen], ISNULL(SO.[Suplidor], '') AS [SuplidorOrigen], A.[CodSuplidorDestino], ISNULL(SD.[Suplidor], '') AS [SuplidorDestino], A.[CodProducto], P.[Producto], ISNULL(A.[CantidadEstandar], 0) AS [CantidadEstandar] FROM CompraVentaSuplidoresCombustible A LEFT JOIN Suplidor SO ON SO.[CodSuplidor] = A.[CodSuplidorOrigen] LEFT JOIN Suplidor SD ON SD.[CodSuplidor] = A.[CodSuplidorDestino] INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE A.[CodCompraVentaSuplidoresCombustible] > 0 AND A.[Estatus] = 1 AND A.[Fecha] >= '" + fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "') ORDER BY A.[Fecha], A.[CodCompraVentaSuplidoresCombustible]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarCompraVentaFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarCompraVentaFilaDTO { Codigo = Convert.ToInt32(reader["Codigo"]), Fecha = Convert.ToDateTime(reader["Fecha"]), CodSuplidorOrigen = Convert.ToInt32(reader["CodSuplidorOrigen"]), SuplidorOrigen = reader["SuplidorOrigen"].ToString() ?? "", CodSuplidorDestino = Convert.ToInt32(reader["CodSuplidorDestino"]), SuplidorDestino = reader["SuplidorDestino"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"], CultureInfo.InvariantCulture) });
            return filas;
        }

        internal List<MovComStandarCompraVentaFilaDTO> ListarCompraVentaSuplidoresAmbiente(DateTime fechaInicial, DateTime fechaFinal)
        {
            string consulta = "SELECT A.[CodCompraVentaSuplidoresCombustible] AS [Codigo], A.[Fecha], A.[CodSuplidorOrigen], ISNULL(SO.[Suplidor], '') AS [SuplidorOrigen], A.[CodSuplidorDestino], ISNULL(SD.[Suplidor], '') AS [SuplidorDestino], A.[CodProducto], P.[Producto], ISNULL(A.[CantidadAmbiente], 0) AS [CantidadAmbiente] FROM CompraVentaSuplidoresCombustible A LEFT JOIN Suplidor SO ON SO.[CodSuplidor] = A.[CodSuplidorOrigen] LEFT JOIN Suplidor SD ON SD.[CodSuplidor] = A.[CodSuplidorDestino] INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE A.[CodCompraVentaSuplidoresCombustible] > 0 AND A.[Estatus] = 1 AND A.[Fecha] >= '" + fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "') ORDER BY A.[Fecha], A.[CodCompraVentaSuplidoresCombustible]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarCompraVentaFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarCompraVentaFilaDTO { Codigo = Convert.ToInt32(reader["Codigo"]), Fecha = Convert.ToDateTime(reader["Fecha"]), CodSuplidorOrigen = Convert.ToInt32(reader["CodSuplidorOrigen"]), SuplidorOrigen = reader["SuplidorOrigen"].ToString() ?? "", CodSuplidorDestino = Convert.ToInt32(reader["CodSuplidorDestino"]), SuplidorDestino = reader["SuplidorDestino"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"], CultureInfo.InvariantCulture) });
            return filas;
        }

        internal List<MovComStandarUnidadFilaDTO> ListarMovimientosUnidad(DateTime fechaInicial, DateTime fechaFinal)
        {
            string fechaInicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fechaFin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "SELECT A.[CodUnidadEntradaCombustible] AS [Codigo], A.[Fecha], 'Entrada' AS [Tipo], ISNULL(A.[SiglasUnidad], '') AS [SiglasUnidad], A.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], A.[CodProducto], P.[Producto], ISNULL(A.[CantidadEstandar], 0) AS [CantidadEstandar] FROM UnidadEntradaCombustible A LEFT JOIN Suplidor S ON S.[CodSuplidor] = A.[CodSuplidor] INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE A.[CodUnidadEntradaCombustible] > 0 AND A.[Estatus] = 1 AND A.[Fecha] >= '" + fechaInicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fechaFin + "') "
                + "UNION ALL SELECT A.[CodUnidadSalidaCombustible] AS [Codigo], A.[Fecha], 'Salida' AS [Tipo], ISNULL(A.[SiglasUnidad], '') AS [SiglasUnidad], A.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], A.[CodProducto], P.[Producto], ISNULL(A.[CantidadEstandar], 0) AS [CantidadEstandar] FROM UnidadSalidaCombustible A LEFT JOIN Suplidor S ON S.[CodSuplidor] = A.[CodSuplidor] INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE A.[CodUnidadSalidaCombustible] > 0 AND A.[Estatus] = 1 AND A.[Fecha] >= '" + fechaInicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fechaFin + "') ORDER BY [Fecha], [Tipo], [Codigo]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarUnidadFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarUnidadFilaDTO { Codigo = Convert.ToInt32(reader["Codigo"]), Fecha = Convert.ToDateTime(reader["Fecha"]), Tipo = reader["Tipo"].ToString() ?? "", SiglasUnidad = reader["SiglasUnidad"].ToString() ?? "", CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"], CultureInfo.InvariantCulture) });
            return filas;
        }

        internal List<MovComStandarUnidadFilaDTO> ListarMovimientosUnidadAmbiente(DateTime fechaInicial, DateTime fechaFinal)
        {
            string fechaInicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fechaFin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "SELECT A.[CodUnidadEntradaCombustible] AS [Codigo], A.[Fecha], 'Entrada' AS [Tipo], ISNULL(A.[SiglasUnidad], '') AS [SiglasUnidad], A.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], A.[CodProducto], P.[Producto], ISNULL(A.[CantidadAmbiente], 0) AS [CantidadAmbiente] FROM UnidadEntradaCombustible A LEFT JOIN Suplidor S ON S.[CodSuplidor] = A.[CodSuplidor] INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE A.[CodUnidadEntradaCombustible] > 0 AND A.[Estatus] = 1 AND A.[Fecha] >= '" + fechaInicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fechaFin + "') "
                + "UNION ALL SELECT A.[CodUnidadSalidaCombustible] AS [Codigo], A.[Fecha], 'Salida' AS [Tipo], ISNULL(A.[SiglasUnidad], '') AS [SiglasUnidad], A.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], A.[CodProducto], P.[Producto], ISNULL(A.[CantidadAmbiente], 0) AS [CantidadAmbiente] FROM UnidadSalidaCombustible A LEFT JOIN Suplidor S ON S.[CodSuplidor] = A.[CodSuplidor] INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE A.[CodUnidadSalidaCombustible] > 0 AND A.[Estatus] = 1 AND A.[Fecha] >= '" + fechaInicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fechaFin + "') ORDER BY [Fecha], [Tipo], [Codigo]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarUnidadFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarUnidadFilaDTO { Codigo = Convert.ToInt32(reader["Codigo"]), Fecha = Convert.ToDateTime(reader["Fecha"]), Tipo = reader["Tipo"].ToString() ?? "", SiglasUnidad = reader["SiglasUnidad"].ToString() ?? "", CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"], CultureInfo.InvariantCulture) });
            return filas;
        }

        internal List<MovComStandarUnidadFilaDTO> ListarEntradasUnidadEtanol(DateTime fechaInicial, DateTime fechaFinal, bool ambiente)
        {
            string campo = ambiente ? "CantidadAmbiente" : "CantidadEstandar";
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "SELECT A.[CodUnidadEntradaEtanol] AS [Codigo], A.[Fecha], 'Entrada' AS [Tipo], ISNULL(A.[SiglasUnidad], '') AS [SiglasUnidad], A.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], A.[CodProducto], P.[Producto], ISNULL(A.[CantidadBoletas], 0) AS [CantidadBoletas], ISNULL(A.[" + campo + "], 0) AS [Cantidad] FROM UnidadEntradaEtanol A LEFT JOIN Suplidor S ON S.[CodSuplidor] = A.[CodSuplidor] INNER JOIN Producto P ON P.[CodProducto] = A.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ETANOL' WHERE A.[Estatus] = 1 AND A.[Fecha] >= '" + inicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fin + "') ORDER BY A.[Fecha], A.[CodSuplidor], A.[CodUnidadEntradaEtanol]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarUnidadFilaDTO> filas = new();
            while (reader.Read())
            {
                MovComStandarUnidadFilaDTO fila = new() { Codigo = Convert.ToInt32(reader["Codigo"]), Fecha = Convert.ToDateTime(reader["Fecha"]), Tipo = reader["Tipo"].ToString() ?? "", SiglasUnidad = reader["SiglasUnidad"].ToString() ?? "", CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", CantidadBoletas = Convert.ToDecimal(reader["CantidadBoletas"], CultureInfo.InvariantCulture) };
                if (ambiente) fila.CantidadAmbiente = Convert.ToDecimal(reader["Cantidad"], CultureInfo.InvariantCulture);
                else fila.CantidadEstandar = Convert.ToDecimal(reader["Cantidad"], CultureInfo.InvariantCulture);
                filas.Add(fila);
            }
            return filas;
        }

        internal List<MovComStandarIngresoBarcoFilaDTO> ListarIngresosBarco(DateTime fechaInicial, DateTime fechaFinal)
        {
            string consulta = "SELECT I.[CodIngresoBarco], I.[FechaIngreso], ISNULL(B.[Barco], '') AS [Barco], "
                + "D.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], D.[CodProducto], "
                + "ISNULL(P.[Producto], '') AS [Producto], D.[CantidadEstandar] "
                + "FROM IngresoBarco I "
                + "INNER JOIN IngresoBarcoDetalle D ON D.[CodIngresoBarco] = I.[CodIngresoBarco] "
                + "LEFT JOIN Barco B ON B.[CodBarco] = I.[CodBarco] "
                + "LEFT JOIN Suplidor S ON S.[CodSuplidor] = D.[CodSuplidor] "
                + "INNER JOIN Producto P ON P.[CodProducto] = D.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' "
                + "WHERE I.[CodIngresoBarco] > 0 AND I.[Estatus] = 1 AND D.[Estatus] = 1 AND I.[FechaIngreso] >= '" + fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture)
                + "' AND I.[FechaIngreso] < DATEADD(DAY, 1, '" + fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "') "
                + "ORDER BY I.[FechaIngreso], I.[CodIngresoBarco], D.[Linea]";

            using DB db = new();
            db.Conectar();
            db.CrearComando(consulta);
            using SqlDataReader reader = db.EjecutarReader();
            List<MovComStandarIngresoBarcoFilaDTO> filas = new();
            while (reader.Read())
            {
                filas.Add(new MovComStandarIngresoBarcoFilaDTO
                {
                    CodIngresoBarco = Convert.ToInt32(reader["CodIngresoBarco"]),
                    FechaIngreso = Convert.ToDateTime(reader["FechaIngreso"]),
                    Barco = reader["Barco"].ToString() ?? "",
                    CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]),
                    Suplidor = reader["Suplidor"].ToString() ?? "",
                    CodProducto = Convert.ToInt32(reader["CodProducto"]),
                    Producto = reader["Producto"].ToString() ?? "",
                    CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"], CultureInfo.InvariantCulture)
                });
            }
            return filas;
        }

        internal List<MovComStandarIngresoBarcoFilaDTO> ListarIngresosBarcoAmbiente(DateTime fechaInicial, DateTime fechaFinal)
        {
            string consulta = "SELECT I.[CodIngresoBarco], I.[FechaIngreso], ISNULL(B.[Barco], '') AS [Barco], "
                + "D.[CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor], D.[CodProducto], "
                + "ISNULL(P.[Producto], '') AS [Producto], ISNULL(D.[CantidadAmbiente], 0) AS [CantidadAmbiente] "
                + "FROM IngresoBarco I "
                + "INNER JOIN IngresoBarcoDetalle D ON D.[CodIngresoBarco] = I.[CodIngresoBarco] "
                + "LEFT JOIN Barco B ON B.[CodBarco] = I.[CodBarco] "
                + "LEFT JOIN Suplidor S ON S.[CodSuplidor] = D.[CodSuplidor] "
                + "INNER JOIN Producto P ON P.[CodProducto] = D.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' "
                + "WHERE I.[CodIngresoBarco] > 0 AND I.[Estatus] = 1 AND D.[Estatus] = 1 AND I.[FechaIngreso] >= '" + fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture)
                + "' AND I.[FechaIngreso] < DATEADD(DAY, 1, '" + fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "') "
                + "ORDER BY I.[FechaIngreso], I.[CodIngresoBarco], D.[Linea]";

            using DB db = new();
            db.Conectar();
            db.CrearComando(consulta);
            using SqlDataReader reader = db.EjecutarReader();
            List<MovComStandarIngresoBarcoFilaDTO> filas = new();
            while (reader.Read())
            {
                filas.Add(new MovComStandarIngresoBarcoFilaDTO
                {
                    CodIngresoBarco = Convert.ToInt32(reader["CodIngresoBarco"]),
                    FechaIngreso = Convert.ToDateTime(reader["FechaIngreso"]),
                    Barco = reader["Barco"].ToString() ?? "",
                    CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]),
                    Suplidor = reader["Suplidor"].ToString() ?? "",
                    CodProducto = Convert.ToInt32(reader["CodProducto"]),
                    Producto = reader["Producto"].ToString() ?? "",
                    CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"], CultureInfo.InvariantCulture)
                });
            }
            return filas;
        }

        internal List<MovComStandarTanqueFilaDTO> ListarTanques(DateTime fechaInicial, DateTime fechaFinal)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "WITH UltimaFecha AS (SELECT MAX(CONVERT(DATE, A.[Fecha])) AS [Fecha] FROM VolumenTanque A WHERE A.[Estatus] = 1 AND A.[Fecha] >= '" + inicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fin + "')) "
                + "SELECT V.[Fecha], V.[CodTanque], ISNULL(T.[Tanque], '') AS [Tanque], ISNULL(T.[CodProducto], 0) AS [CodProducto], ISNULL(P.[Producto], '') AS [Producto], V.[Pies], V.[Pulgadas], V.[Dieciseisavos], V.[MedidaAguaPies], V.[MedidaAguaPulgadas], V.[Volumen], V.[VolumenAgua], V.[CorreccionTecho], V.[Temperatura], V.[Api], V.[Factor], V.[VolumenAmbiente], V.[VolumenEstandar], V.[CapacidadMaxima], V.[CapacidadDisponible] FROM VolumenTanque V INNER JOIN Tanque T ON T.[CodTanque] = V.[CodTanque] AND T.[Estatus] = 1 LEFT JOIN Producto P ON P.[CodProducto] = T.[CodProducto] CROSS JOIN UltimaFecha U WHERE V.[Estatus] = 1 AND CONVERT(DATE, V.[Fecha]) = U.[Fecha] ORDER BY P.[Producto], V.[CodTanque]";
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarTanqueFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarTanqueFilaDTO { Fecha = Convert.ToDateTime(reader["Fecha"]), CodTanque = reader["CodTanque"].ToString() ?? "", Tanque = reader["Tanque"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", Pies = Convert.ToInt32(reader["Pies"]), Pulgadas = Convert.ToInt32(reader["Pulgadas"]), Dieciseisavos = Convert.ToInt32(reader["Dieciseisavos"]), MedidaAguaPies = Convert.ToInt32(reader["MedidaAguaPies"]), MedidaAguaPulgadas = Convert.ToInt32(reader["MedidaAguaPulgadas"]), Volumen = Convert.ToDecimal(reader["Volumen"]), VolumenAgua = Convert.ToDecimal(reader["VolumenAgua"]), CorreccionTecho = Convert.ToDecimal(reader["CorreccionTecho"]), Temperatura = Convert.ToDecimal(reader["Temperatura"]), Api = Convert.ToDecimal(reader["Api"]), Factor = Convert.ToDecimal(reader["Factor"]), VolumenAmbiente = Convert.ToDecimal(reader["VolumenAmbiente"]), VolumenEstandar = Convert.ToDecimal(reader["VolumenEstandar"]), CapacidadMaxima = Convert.ToDecimal(reader["CapacidadMaxima"]), CapacidadDisponible = Convert.ToDecimal(reader["CapacidadDisponible"]) });
            return filas;
        }

        internal List<MovComStandarAditivoFilaDTO> ListarAditivos(DateTime fechaInicial, DateTime fechaFinal)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "WITH UltimaMedicion AS (SELECT MAX(CONVERT(DATE, V.[Fecha])) AS [Fecha] FROM VolumenTanque V WHERE V.[Estatus] = 1 AND V.[Fecha] >= '" + inicio + "' AND V.[Fecha] < DATEADD(DAY, 1, '" + fin + "')), Movimientos AS (SELECT A.[CodProducto], SUM(CASE WHEN UPPER(A.[TipoMovimiento]) = 'SALIDA' THEN 0 ELSE ISNULL(A.[Cantidad], 0) END) AS [OtrosIngresos], SUM(CASE WHEN UPPER(A.[TipoMovimiento]) = 'SALIDA' THEN ISNULL(A.[Cantidad], 0) ELSE 0 END) AS [OtrasSalidas] FROM dbo.fn_AditivoMovimientos() A WHERE A.[Fecha] >= '" + inicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fin + "') GROUP BY A.[CodProducto]), MapeoAditivo AS (SELECT DISTINCT P.[CodProducto], TRY_CONVERT(INT, A.[IdProductoBaseTms]) AS [IdProductoBaseTms] FROM ReporteInventarioMapeoProductoTms A INNER JOIN Producto P ON P.[CodProducto] = TRY_CONVERT(INT, A.[CodProducto]) WHERE A.[Estatus] = 1 AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ADITIVO' AND UPPER(LTRIM(RTRIM(A.[TipoProducto]))) = 'ADITIVO' AND UPPER(LTRIM(RTRIM(A.[TipoProductoTms]))) IN ('ADICTIVO', 'ADITIVO') AND TRY_CONVERT(INT, A.[IdProductoBaseTms]) IS NOT NULL), ConsumosBi AS (SELECT M.[CodProducto], SUM(ISNULL(T.[CantidadComponente], 0)) AS [ConsumosBi] FROM [BI].dbo.[TMS] T INNER JOIN MapeoAditivo M ON M.[IdProductoBaseTms] = TRY_CONVERT(INT, T.[IdProductoBase]) WHERE UPPER(LTRIM(RTRIM(T.[TipoProducto]))) IN ('ADICTIVO', 'ADITIVO') AND T.[Fecha] >= '" + inicio + "' AND T.[Fecha] < DATEADD(DAY, 1, '" + fin + "') GROUP BY M.[CodProducto]), Fisico AS (SELECT T.[CodProducto], SUM(ISNULL(V.[VolumenEstandar], 0)) AS [FinalFisicoTanques] FROM VolumenTanque V INNER JOIN Tanque T ON T.[CodTanque] = V.[CodTanque] CROSS JOIN UltimaMedicion U WHERE V.[Estatus] = 1 AND T.[Estatus] = 1 AND CONVERT(DATE, V.[Fecha]) = U.[Fecha] GROUP BY T.[CodProducto]) SELECT P.[CodProducto], P.[Producto], ISNULL(SI.[Cantidad], 0) AS [SaldoInicial], ISNULL(M.[OtrosIngresos], 0) AS [OtrosIngresos], ISNULL(M.[OtrasSalidas], 0) AS [OtrasSalidas], ISNULL(C.[ConsumosBi], 0) AS [ConsumosBi], ISNULL(F.[FinalFisicoTanques], 0) AS [FinalFisicoTanques] FROM Producto P OUTER APPLY (SELECT TOP 1 A.[Cantidad] FROM SaldoInicialAditivo A WHERE A.[Estatus] = 1 AND A.[CodProducto] = P.[CodProducto] AND A.[Fecha] <= '" + inicio + "' ORDER BY A.[Fecha] DESC, A.[CodSaldoInicialAditivo] DESC) SI LEFT JOIN Movimientos M ON M.[CodProducto] = P.[CodProducto] LEFT JOIN ConsumosBi C ON C.[CodProducto] = P.[CodProducto] LEFT JOIN Fisico F ON F.[CodProducto] = P.[CodProducto] WHERE UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ADITIVO' AND P.[Estatus] = 1 ORDER BY P.[Producto]";
            consulta = "WITH UltimaMedicion AS (SELECT MAX(CONVERT(DATE, V.[Fecha])) AS [Fecha] FROM VolumenTanque V WHERE V.[Estatus] = 1 AND V.[Fecha] >= '" + inicio + "' AND V.[Fecha] < DATEADD(DAY, 1, '" + fin + "')), Movimientos AS (SELECT A.[CodProducto], SUM(CASE WHEN UPPER(A.[TipoMovimiento]) = 'SALIDA' THEN 0 ELSE ISNULL(A.[Cantidad], 0) END) AS [OtrosIngresos], SUM(CASE WHEN UPPER(A.[TipoMovimiento]) = 'SALIDA' THEN ISNULL(A.[Cantidad], 0) ELSE 0 END) AS [OtrasSalidas] FROM dbo.fn_AditivoMovimientos() A WHERE A.[Fecha] >= '" + inicio + "' AND A.[Fecha] < DATEADD(DAY, 1, '" + fin + "') GROUP BY A.[CodProducto]), Fisico AS (SELECT T.[CodProducto], SUM(ISNULL(V.[VolumenEstandar], 0)) AS [FinalFisicoTanques] FROM VolumenTanque V INNER JOIN Tanque T ON T.[CodTanque] = V.[CodTanque] CROSS JOIN UltimaMedicion U WHERE V.[Estatus] = 1 AND T.[Estatus] = 1 AND CONVERT(DATE, V.[Fecha]) = U.[Fecha] GROUP BY T.[CodProducto]) SELECT P.[CodProducto], P.[Producto], ISNULL(SI.[Cantidad], 0) AS [SaldoInicial], ISNULL(M.[OtrosIngresos], 0) AS [OtrosIngresos], ISNULL(M.[OtrasSalidas], 0) AS [OtrasSalidas], CAST(0 AS DECIMAL(18,4)) AS [ConsumosBi], ISNULL(F.[FinalFisicoTanques], 0) AS [FinalFisicoTanques] FROM Producto P OUTER APPLY (SELECT TOP 1 A.[Cantidad] FROM SaldoInicialAditivo A WHERE A.[Estatus] = 1 AND A.[CodProducto] = P.[CodProducto] AND A.[Fecha] <= '" + inicio + "' ORDER BY A.[Fecha] DESC, A.[CodSaldoInicialAditivo] DESC) SI LEFT JOIN Movimientos M ON M.[CodProducto] = P.[CodProducto] LEFT JOIN Fisico F ON F.[CodProducto] = P.[CodProducto] WHERE UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ADITIVO' AND P.[Estatus] = 1 ORDER BY P.[Producto]";
            consulta = ConstruirConsultaResumenAditivos(inicio, fin);
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); db.cmd!.CommandTimeout = 180; using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarAditivoFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarAditivoFilaDTO { CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", SaldoInicial = Convert.ToDecimal(reader["SaldoInicial"]), OtrosIngresos = Convert.ToDecimal(reader["OtrosIngresos"]), OtrasSalidas = Convert.ToDecimal(reader["OtrasSalidas"]), ConsumosBi = Convert.ToDecimal(reader["ConsumosBi"]), FinalFisicoTanques = Convert.ToDecimal(reader["FinalFisicoTanques"]) });
            return filas;
        }

        private static string ConstruirConsultaResumenAditivos(string inicio, string fin) => $"""
            WITH UltimaMedicion AS (
                SELECT MAX(CONVERT(DATE, V.[Fecha])) AS [Fecha]
                FROM VolumenTanque V
                WHERE V.[Estatus] = 1 AND V.[Fecha] >= '{inicio}' AND V.[Fecha] < DATEADD(DAY, 1, '{fin}')
            ), Movimientos AS (
                SELECT A.[CodProducto],
                    SUM(CASE WHEN UPPER(A.[TipoMovimiento]) = 'SALIDA' THEN 0 ELSE ISNULL(A.[Cantidad], 0) END) AS [OtrosIngresos],
                    SUM(CASE WHEN UPPER(A.[TipoMovimiento]) = 'SALIDA' THEN ISNULL(A.[Cantidad], 0) ELSE 0 END) AS [OtrasSalidas]
                FROM dbo.fn_AditivoMovimientos() A
                WHERE A.[Fecha] >= '{inicio}' AND A.[Fecha] < DATEADD(DAY, 1, '{fin}')
                GROUP BY A.[CodProducto]
            ), FoliosReporte AS (
                SELECT F.[FolioAnio], F.[FolioMes], F.[Folio], F.[FechaHoraApertura], F.[FechaHoraCongelamiento]
                FROM [BI].dbo.[FolioTms] F
                WHERE CONVERT(DATE, F.[FechaHoraUltimaCarga]) >= '{inicio}'
                  AND CONVERT(DATE, F.[FechaHoraUltimaCarga]) <= '{fin}'
            ), TmsNormalizado AS (
                SELECT T.*
                FROM [BI].dbo.[TMS] T
                INNER JOIN FoliosReporte F ON F.[FolioAnio] = T.[FolioAnio] AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio]
                WHERE UPPER(LTRIM(RTRIM(T.[TipoProducto]))) IN ('ADICTIVO', 'ADITIVO')
                  AND (F.[FechaHoraApertura] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) >= F.[FechaHoraApertura])
                  AND (F.[FechaHoraCongelamiento] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) <= F.[FechaHoraCongelamiento])
                  AND {FiltroTmsDespacho("T")}
            ), DespachosSinDuplicados AS (
                SELECT T.*, ROW_NUMBER() OVER (PARTITION BY T.[FolioAnio], T.[FolioMes], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoBase] ORDER BY T.[Anio], T.[FolioAnio], T.[Mes], T.[FolioMes], T.[Dia], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoSocio]) AS [FilaPorOrdenRecord]
                FROM TmsNormalizado T
            ), MapeoAditivo AS (
                SELECT DISTINCT P.[CodProducto], TRY_CONVERT(INT, M.[IdProductoBaseTms]) AS [IdProductoBaseTms]
                FROM ReporteInventarioMapeoProductoTms M
                INNER JOIN Producto P ON P.[CodProducto] = TRY_CONVERT(INT, M.[CodProducto])
                WHERE M.[Estatus] = 1 AND P.[Estatus] = 1
                  AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ADITIVO'
                  AND UPPER(LTRIM(RTRIM(M.[TipoProducto]))) = 'ADITIVO'
                  AND UPPER(LTRIM(RTRIM(M.[TipoProductoTms]))) IN ('ADICTIVO', 'ADITIVO')
            ), ConsumosBi AS (
                SELECT M.[CodProducto], SUM(CASE WHEN T.[Signo] = '-' THEN -ISNULL(T.[ImporteComponente], 0) ELSE ISNULL(T.[ImporteComponente], 0) END) AS [ConsumosBi]
                FROM DespachosSinDuplicados T
                INNER JOIN MapeoAditivo M ON M.[IdProductoBaseTms] = TRY_CONVERT(INT, T.[IdProductoBase])
                WHERE T.[FilaPorOrdenRecord] = 1
                GROUP BY M.[CodProducto]
            ), Fisico AS (
                SELECT T.[CodProducto], SUM(ISNULL(V.[VolumenEstandar], 0)) AS [FinalFisicoTanques]
                FROM VolumenTanque V
                INNER JOIN Tanque T ON T.[CodTanque] = V.[CodTanque]
                CROSS JOIN UltimaMedicion U
                WHERE V.[Estatus] = 1 AND T.[Estatus] = 1 AND CONVERT(DATE, V.[Fecha]) = U.[Fecha]
                GROUP BY T.[CodProducto]
            )
            SELECT P.[CodProducto], P.[Producto], ISNULL(SI.[Cantidad], 0) AS [SaldoInicial],
                ISNULL(M.[OtrosIngresos], 0) AS [OtrosIngresos], ISNULL(M.[OtrasSalidas], 0) AS [OtrasSalidas],
                ISNULL(C.[ConsumosBi], 0) AS [ConsumosBi], ISNULL(F.[FinalFisicoTanques], 0) AS [FinalFisicoTanques]
            FROM Producto P
            OUTER APPLY (SELECT TOP 1 A.[Cantidad] FROM SaldoInicialAditivo A WHERE A.[Estatus] = 1 AND A.[CodProducto] = P.[CodProducto] AND A.[Fecha] <= '{inicio}' ORDER BY A.[Fecha] DESC, A.[CodSaldoInicialAditivo] DESC) SI
            LEFT JOIN Movimientos M ON M.[CodProducto] = P.[CodProducto]
            LEFT JOIN ConsumosBi C ON C.[CodProducto] = P.[CodProducto]
            LEFT JOIN Fisico F ON F.[CodProducto] = P.[CodProducto]
            WHERE UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ADITIVO' AND P.[Estatus] = 1
            ORDER BY P.[Producto]
            """;

        internal List<MovComStandarConsumoBiFilaDTO> ListarConsumosBiAditivos(DateTime fechaInicial, DateTime fechaFinal)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = $"""
                WITH FoliosReporte AS (
                    SELECT F.[FolioAnio], F.[FolioMes], F.[Folio], F.[FechaHoraApertura], F.[FechaHoraCongelamiento]
                    FROM [BI].dbo.[FolioTms] F
                    WHERE CONVERT(DATE, F.[FechaHoraUltimaCarga]) >= '{inicio}'
                      AND CONVERT(DATE, F.[FechaHoraUltimaCarga]) <= '{fin}'
                ), TmsNormalizado AS (
                    SELECT T.*
                    FROM [BI].dbo.[TMS] T
                    INNER JOIN FoliosReporte F ON F.[FolioAnio] = T.[FolioAnio] AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio]
                    WHERE UPPER(LTRIM(RTRIM(T.[TipoProducto]))) IN ('ADICTIVO', 'ADITIVO')
                      AND (F.[FechaHoraApertura] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) >= F.[FechaHoraApertura])
                      AND (F.[FechaHoraCongelamiento] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) <= F.[FechaHoraCongelamiento])
                      AND {FiltroTmsDespacho("T")}
                ), DespachosSinDuplicados AS (
                    SELECT T.*, ROW_NUMBER() OVER (PARTITION BY T.[FolioAnio], T.[FolioMes], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoBase] ORDER BY T.[Anio], T.[FolioAnio], T.[Mes], T.[FolioMes], T.[Dia], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoSocio]) AS [FilaPorOrdenRecord]
                    FROM TmsNormalizado T
                ), MapeoAditivo AS (
                    SELECT DISTINCT P.[CodProducto], P.[Producto], TRY_CONVERT(INT, M.[IdProductoBaseTms]) AS [IdProductoBaseTms]
                    FROM ReporteInventarioMapeoProductoTms M
                    INNER JOIN Producto P ON P.[CodProducto] = TRY_CONVERT(INT, M.[CodProducto])
                    WHERE M.[Estatus] = 1 AND P.[Estatus] = 1
                      AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ADITIVO'
                      AND UPPER(LTRIM(RTRIM(M.[TipoProducto]))) = 'ADITIVO'
                      AND UPPER(LTRIM(RTRIM(M.[TipoProductoTms]))) IN ('ADICTIVO', 'ADITIVO')
                )
                SELECT A.[CodProducto], A.[Producto],
                    SUM(CASE WHEN T.[Signo] = '-' THEN -ISNULL(T.[ImporteComponente], 0) ELSE ISNULL(T.[ImporteComponente], 0) END) AS [Consumos]
                FROM DespachosSinDuplicados T
                INNER JOIN MapeoAditivo A ON A.[IdProductoBaseTms] = TRY_CONVERT(INT, T.[IdProductoBase])
                WHERE T.[FilaPorOrdenRecord] = 1
                GROUP BY A.[CodProducto], A.[Producto]
                ORDER BY A.[Producto]
                """;
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); db.cmd!.CommandTimeout = 180; using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarConsumoBiFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarConsumoBiFilaDTO { CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", Consumos = Convert.ToDecimal(reader["Consumos"]) });
            return filas;
        }

        internal List<MovComStandarConsumoBiDiarioFilaDTO> ListarConsumosBiDiariosAditivosEstandar(DateTime fechaInicial, DateTime fechaFinal)
            => EjecutarConsumosBiDiariosAditivos(fechaInicial, fechaFinal, false);

        internal List<MovComStandarConsumoBiDiarioFilaDTO> ListarConsumosBiDiariosAditivosAmbiente(DateTime fechaInicial, DateTime fechaFinal)
            => EjecutarConsumosBiDiariosAditivos(fechaInicial, fechaFinal, true);

        private List<MovComStandarConsumoBiDiarioFilaDTO> EjecutarConsumosBiDiariosAditivos(DateTime fechaInicial, DateTime fechaFinal, bool ambiente)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = $"""
                WITH FoliosReporte AS (
                    SELECT F.[FolioAnio], F.[FolioMes], F.[Folio], F.[FechaHoraApertura], F.[FechaHoraCongelamiento]
                    FROM [BI].dbo.[FolioTms] F
                    WHERE CONVERT(DATE, F.[FechaHoraUltimaCarga]) >= '{inicio}'
                      AND CONVERT(DATE, F.[FechaHoraUltimaCarga]) <= '{fin}'
                ), TmsNormalizado AS (
                    SELECT T.*
                    FROM [BI].dbo.[TMS] T
                    INNER JOIN FoliosReporte F ON F.[FolioAnio] = T.[FolioAnio] AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio]
                    WHERE UPPER(LTRIM(RTRIM(T.[TipoProducto]))) IN ('ADICTIVO', 'ADITIVO')
                      AND (F.[FechaHoraApertura] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) >= F.[FechaHoraApertura])
                      AND (F.[FechaHoraCongelamiento] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) <= F.[FechaHoraCongelamiento])
                      AND {FiltroTmsDespacho("T")}
                ), DespachosSinDuplicados AS (
                    SELECT T.*, ROW_NUMBER() OVER (PARTITION BY T.[FolioAnio], T.[FolioMes], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoBase] ORDER BY T.[Anio], T.[FolioAnio], T.[Mes], T.[FolioMes], T.[Dia], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoSocio]) AS [FilaPorOrdenRecord]
                    FROM TmsNormalizado T
                ), MapeoAditivo AS (
                    SELECT DISTINCT P.[CodProducto], P.[Producto], TRY_CONVERT(INT, M.[IdProductoBaseTms]) AS [IdProductoBaseTms]
                    FROM ReporteInventarioMapeoProductoTms M
                    INNER JOIN Producto P ON P.[CodProducto] = TRY_CONVERT(INT, M.[CodProducto])
                    WHERE M.[Estatus] = 1 AND P.[Estatus] = 1
                      AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ADITIVO'
                      AND UPPER(LTRIM(RTRIM(M.[TipoProducto]))) = 'ADITIVO'
                      AND UPPER(LTRIM(RTRIM(M.[TipoProductoTms]))) IN ('ADICTIVO', 'ADITIVO')
                )
                SELECT CONVERT(DATE, T.[Fecha]) AS [Fecha], MS.[CodSuplidor], S.[Suplidor], A.[CodProducto], A.[Producto],
                    SUM(CASE WHEN T.[Signo] = '-' THEN -ISNULL(T.[CantidadComponente], 0) ELSE ISNULL(T.[CantidadComponente], 0) END) AS [Consumos]
                FROM DespachosSinDuplicados T
                INNER JOIN MapeoAditivo A ON A.[IdProductoBaseTms] = TRY_CONVERT(INT, T.[IdProductoBase])
                INNER JOIN ReporteInventarioMapeoSuplidorTms MS ON MS.[IdSocioTms] = T.[IdSocio] AND MS.[Estatus] = 1
                INNER JOIN Suplidor S ON S.[CodSuplidor] = MS.[CodSuplidor] AND S.[Estatus] = 1
                WHERE T.[FilaPorOrdenRecord] = 1
                GROUP BY CONVERT(DATE, T.[Fecha]), MS.[CodSuplidor], S.[Suplidor], A.[CodProducto], A.[Producto]
                ORDER BY [Fecha], S.[Suplidor], A.[Producto]
                """;
            if (!ambiente) consulta = consulta.Replace("[CantidadComponente]", "[ImporteComponente]");
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); db.cmd!.CommandTimeout = 180; using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarConsumoBiDiarioFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarConsumoBiDiarioFilaDTO { Fecha = Convert.ToDateTime(reader["Fecha"]), CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", Consumos = Convert.ToDecimal(reader["Consumos"], CultureInfo.InvariantCulture) });
            return filas;
        }

        internal List<MovComStandarConsumoBiDiarioFilaDTO> ListarConsumosBiDiariosEtanolEstandar(DateTime fechaInicial, DateTime fechaFinal)
            => EjecutarConsumosBiDiariosEtanol(fechaInicial, fechaFinal, false);

        internal List<MovComStandarConsumoBiDiarioFilaDTO> ListarConsumosBiDiariosEtanolAmbiente(DateTime fechaInicial, DateTime fechaFinal)
            => EjecutarConsumosBiDiariosEtanol(fechaInicial, fechaFinal, true);

        private List<MovComStandarConsumoBiDiarioFilaDTO> EjecutarConsumosBiDiariosEtanol(DateTime fechaInicial, DateTime fechaFinal, bool ambiente)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            // BI/TMS registra la mezcla como dos líneas BASE: 90 % MOGAS 91 y 10 % etanol.
            // El reporte debe usar el importe de la línea de etanol tal como se despachó.
            string consulta = $"""
                WITH FoliosReporte AS (
                    SELECT F.[FolioAnio], F.[FolioMes], F.[Folio], F.[FechaHoraApertura], F.[FechaHoraCongelamiento]
                    FROM [BI].dbo.[FolioTms] F
                    WHERE CONVERT(DATE, F.[FechaHoraUltimaCarga]) >= '{inicio}'
                      AND CONVERT(DATE, F.[FechaHoraUltimaCarga]) <= '{fin}'
                ), TmsNormalizado AS (
                    SELECT T.*
                    FROM [BI].dbo.[TMS] T
                    INNER JOIN FoliosReporte F ON F.[FolioAnio] = T.[FolioAnio] AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio]
                    WHERE UPPER(LTRIM(RTRIM(T.[TipoProducto]))) = 'BASE'
                      AND (F.[FechaHoraApertura] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) >= F.[FechaHoraApertura])
                      AND (F.[FechaHoraCongelamiento] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) <= F.[FechaHoraCongelamiento])
                      AND {FiltroTmsDespacho("T")}
                ), DespachosSinDuplicados AS (
                    SELECT T.*, ROW_NUMBER() OVER (PARTITION BY T.[FolioAnio], T.[FolioMes], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoBase] ORDER BY T.[Anio], T.[FolioAnio], T.[Mes], T.[FolioMes], T.[Dia], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoSocio]) AS [FilaPorOrdenRecord]
                    FROM TmsNormalizado T
                ), MapeoEtanol AS (
                    SELECT DISTINCT P.[CodProducto], P.[Producto], TRY_CONVERT(INT, M.[IdProductoBaseTms]) AS [IdProductoBaseTms]
                    FROM ReporteInventarioMapeoProductoTms M
                    INNER JOIN Producto P ON P.[CodProducto] = TRY_CONVERT(INT, M.[CodProducto])
                    WHERE M.[Estatus] = 1 AND P.[Estatus] = 1
                      AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'ETANOL'
                      AND UPPER(LTRIM(RTRIM(M.[TipoProducto]))) = 'ETANOL'
                      AND UPPER(LTRIM(RTRIM(M.[TipoProductoTms]))) = 'BASE'
                )
                SELECT CONVERT(DATE, T.[Fecha]) AS [Fecha], MS.[CodSuplidor], S.[Suplidor], E.[CodProducto], E.[Producto],
                    SUM(CASE WHEN T.[Signo] = '-' THEN -ISNULL(T.[ImporteComponente], 0) ELSE ISNULL(T.[ImporteComponente], 0) END) AS [Consumos]
                FROM DespachosSinDuplicados T
                INNER JOIN ReporteInventarioMapeoSuplidorTms MS ON MS.[IdSocioTms] = T.[IdSocio] AND MS.[Estatus] = 1
                INNER JOIN MapeoEtanol E ON E.[IdProductoBaseTms] = TRY_CONVERT(INT, T.[IdProductoBase])
                INNER JOIN Suplidor S ON S.[CodSuplidor] = MS.[CodSuplidor] AND S.[Estatus] = 1
                WHERE T.[FilaPorOrdenRecord] = 1
                  AND ISNULL(T.[PorcentajeAdictivo], 0) > 0
                  AND ISNULL(T.[PorcentajeAdictivo], 100) < 100
                GROUP BY CONVERT(DATE, T.[Fecha]), MS.[CodSuplidor], S.[Suplidor], E.[CodProducto], E.[Producto]
                ORDER BY [Fecha], S.[Suplidor], E.[Producto]
                """;
            if (ambiente) consulta = consulta.Replace("[ImporteComponente]", "[CantidadComponente]");
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); db.cmd!.CommandTimeout = 180; using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarConsumoBiDiarioFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarConsumoBiDiarioFilaDTO { Fecha = Convert.ToDateTime(reader["Fecha"]), CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", Consumos = Convert.ToDecimal(reader["Consumos"], CultureInfo.InvariantCulture) });
            return filas;
        }

        internal List<MovComStandarConsumoBiCombustibleDiarioFilaDTO> ListarConsumosBiDiariosCombustiblesEstandar(DateTime fechaInicial, DateTime fechaFinal)
            => EjecutarConsumosBiDiariosCombustibles(fechaInicial, fechaFinal, false);

        internal List<MovComStandarConsumoBiCombustibleDiarioFilaDTO> ListarConsumosBiDiariosCombustiblesAmbiente(DateTime fechaInicial, DateTime fechaFinal)
            => EjecutarConsumosBiDiariosCombustibles(fechaInicial, fechaFinal, true);

        private List<MovComStandarConsumoBiCombustibleDiarioFilaDTO> EjecutarConsumosBiDiariosCombustibles(DateTime fechaInicial, DateTime fechaFinal, bool ambiente)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string consulta = "WITH FoliosReporte AS (SELECT F.[FolioAnio], F.[FolioMes], F.[Folio], F.[FechaHoraApertura], F.[FechaHoraCongelamiento] FROM [BI].dbo.[FolioTms] F WHERE CONVERT(DATE, F.[FechaHoraUltimaCarga]) >= '" + inicio + "' AND CONVERT(DATE, F.[FechaHoraUltimaCarga]) <= '" + fin + "'), TmsNormalizado AS (SELECT T.* FROM [BI].dbo.[TMS] T INNER JOIN FoliosReporte F ON F.[FolioAnio] = T.[FolioAnio] AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio] WHERE UPPER(LTRIM(RTRIM(T.[TipoProducto]))) = 'BASE' AND (F.[FechaHoraApertura] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) >= F.[FechaHoraApertura]) AND (F.[FechaHoraCongelamiento] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) <= F.[FechaHoraCongelamiento])), DespachosSinDuplicados AS (SELECT T.*, ROW_NUMBER() OVER (PARTITION BY T.[FolioAnio], T.[FolioMes], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoBase] ORDER BY T.[Anio], T.[FolioAnio], T.[Mes], T.[FolioMes], T.[Dia], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoSocio]) AS [FilaPorOrdenRecord] FROM TmsNormalizado T) SELECT CONVERT(DATE, T.[Fecha]) AS [Fecha], MS.[CodSuplidor], S.[Suplidor], TRY_CONVERT(INT, MP.[CodProducto]) AS [CodProducto], P.[Producto], SUM(CASE WHEN T.[Signo] = '-' THEN -ISNULL(T.[ImporteComponente], 0) ELSE ISNULL(T.[ImporteComponente], 0) END) AS [Consumos] FROM DespachosSinDuplicados T INNER JOIN ReporteInventarioMapeoSuplidorTms MS ON MS.[IdSocioTms] = T.[IdSocio] AND MS.[Estatus] = 1 CROSS APPLY (SELECT TOP 1 M.[CodProducto] FROM ReporteInventarioMapeoProductoTms M WHERE M.[IdProductoSocioTms] = T.[IdProductoSocio] AND UPPER(LTRIM(RTRIM(M.[TipoProductoTms]))) = UPPER(LTRIM(RTRIM(T.[TipoProducto]))) AND M.[Estatus] = 1 AND (M.[CodSuplidor] = MS.[CodSuplidor] OR M.[CodSuplidor] IS NULL) AND (M.[IdProductoBaseTms] = T.[IdProductoBase] OR M.[IdProductoBaseTms] IS NULL) ORDER BY CASE WHEN M.[CodSuplidor] = MS.[CodSuplidor] THEN 0 ELSE 1 END, CASE WHEN M.[IdProductoBaseTms] = T.[IdProductoBase] THEN 0 ELSE 1 END) MP INNER JOIN Suplidor S ON S.[CodSuplidor] = MS.[CodSuplidor] AND S.[Estatus] = 1 INNER JOIN Producto P ON P.[CodProducto] = TRY_CONVERT(INT, MP.[CodProducto]) AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE T.[FilaPorOrdenRecord] = 1 GROUP BY CONVERT(DATE, T.[Fecha]), MS.[CodSuplidor], S.[Suplidor], MP.[CodProducto], P.[Producto] ORDER BY [Fecha], S.[Suplidor], P.[Producto]";
            consulta = consulta.Replace(" <= F.[FechaHoraCongelamiento])), DespachosSinDuplicados", " <= F.[FechaHoraCongelamiento]) AND " + FiltroTmsDespacho("T") + "), DespachosSinDuplicados");
            if (ambiente) consulta = consulta.Replace("[ImporteComponente]", "[CantidadComponente]");
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); db.cmd!.CommandTimeout = 180; using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarConsumoBiCombustibleDiarioFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarConsumoBiCombustibleDiarioFilaDTO { Fecha = Convert.ToDateTime(reader["Fecha"]), CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", Consumos = Convert.ToDecimal(reader["Consumos"], CultureInfo.InvariantCulture) });
            return filas;
        }

        internal List<MovComStandarFilaDTO> GenerarAmbiente(DateTime fechaInicial, DateTime fechaFinal)
        {
            string inicio = fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fin = fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            string fuenteTms = "(SELECT T.* FROM [BI].dbo.[TMS] T INNER JOIN [BI].dbo.[FolioTms] F ON F.[FolioAnio] = T.[FolioAnio] AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio] WHERE CONVERT(DATE, F.[FechaHoraUltimaCarga]) >= '" + inicio + "' AND CONVERT(DATE, F.[FechaHoraUltimaCarga]) <= '" + fin + "' AND (F.[FechaHoraApertura] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) >= F.[FechaHoraApertura]) AND (F.[FechaHoraCongelamiento] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) <= F.[FechaHoraCongelamiento]) AND " + FiltroTmsDespacho("T") + ")";
            fuenteTms = "(SELECT D.* FROM (SELECT T.*, ROW_NUMBER() OVER (PARTITION BY T.[FolioAnio], T.[FolioMes], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoBase] ORDER BY T.[Anio], T.[FolioAnio], T.[Mes], T.[FolioMes], T.[Dia], T.[Folio], T.[NoOrden], T.[IdRecord], T.[IdProductoSocio]) AS [FilaPorOrdenRecord] FROM [BI].dbo.[TMS] T INNER JOIN [BI].dbo.[FolioTms] F ON F.[FolioAnio] = T.[FolioAnio] AND F.[FolioMes] = T.[FolioMes] AND F.[Folio] = T.[Folio] WHERE CONVERT(DATE, F.[FechaHoraUltimaCarga]) >= '" + inicio + "' AND CONVERT(DATE, F.[FechaHoraUltimaCarga]) <= '" + fin + "' AND (F.[FechaHoraApertura] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) >= F.[FechaHoraApertura]) AND (F.[FechaHoraCongelamiento] IS NULL OR T.[HoraInicioCarga] IS NULL OR DATEADD(SECOND, DATEDIFF(SECOND, CAST('00:00:00' AS TIME), T.[HoraInicioCarga]), CAST(T.[Fecha] AS DATETIME)) <= F.[FechaHoraCongelamiento]) AND " + FiltroTmsDespacho("T") + ") D WHERE D.[FilaPorOrdenRecord] = 1)";
            string consulta = "WITH Despachos AS (SELECT MS.[CodSuplidor], TRY_CONVERT(INT, MP.[CodProducto]) AS [CodProducto], SUM(CASE WHEN T.[Signo] = '-' THEN -ISNULL(T.[CantidadComponente], 0) ELSE ISNULL(T.[CantidadComponente], 0) END) AS [Despachos] FROM " + fuenteTms + " T INNER JOIN ReporteInventarioMapeoSuplidorTms MS ON MS.[IdSocioTms] = T.[IdSocio] AND MS.[Estatus] = 1 CROSS APPLY (SELECT TOP 1 M.[CodProducto] FROM ReporteInventarioMapeoProductoTms M WHERE M.[IdProductoSocioTms] = T.[IdProductoSocio] AND UPPER(LTRIM(RTRIM(M.[TipoProductoTms]))) = UPPER(LTRIM(RTRIM(T.[TipoProducto]))) AND M.[Estatus] = 1 AND (M.[CodSuplidor] = MS.[CodSuplidor] OR M.[CodSuplidor] IS NULL) AND (M.[IdProductoBaseTms] = T.[IdProductoBase] OR M.[IdProductoBaseTms] IS NULL) ORDER BY CASE WHEN M.[CodSuplidor] = MS.[CodSuplidor] THEN 0 ELSE 1 END, CASE WHEN M.[IdProductoBaseTms] = T.[IdProductoBase] THEN 0 ELSE 1 END) MP WHERE UPPER(LTRIM(RTRIM(T.[TipoProducto]))) = 'BASE' GROUP BY MS.[CodSuplidor], MP.[CodProducto]), Recibos AS (SELECT D.[CodSuplidor], D.[CodProducto], SUM(ISNULL(D.[CantidadAmbiente], 0) * 42) AS [Recibos] FROM IngresoBarco I INNER JOIN IngresoBarcoDetalle D ON D.[CodIngresoBarco] = I.[CodIngresoBarco] INNER JOIN Producto P ON P.[CodProducto] = D.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE I.[Estatus] = 1 AND D.[Estatus] = 1 AND I.[FechaIngreso] >= '" + inicio + "' AND I.[FechaIngreso] < DATEADD(DAY, 1, '" + fin + "') GROUP BY D.[CodSuplidor], D.[CodProducto]), OtrasEntradas AS (SELECT C.[CodSuplidorDestino] AS [CodSuplidor], C.[CodProducto], SUM(ISNULL(C.[CantidadAmbiente], 0) * 42) AS [Cantidad] FROM CompraVentaSuplidoresCombustible C INNER JOIN Producto P ON P.[CodProducto] = C.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE C.[Estatus] = 1 AND C.[Fecha] >= '" + inicio + "' AND C.[Fecha] < DATEADD(DAY, 1, '" + fin + "') GROUP BY C.[CodSuplidorDestino], C.[CodProducto]), OtrasSalidas AS (SELECT C.[CodSuplidorOrigen] AS [CodSuplidor], C.[CodProducto], SUM(ISNULL(C.[CantidadAmbiente], 0) * 42) + ISNULL((SELECT SUM(ISNULL(S.[CantidadAmbiente], 0) * 42) FROM Salidas S WHERE S.[Estatus] = 1 AND S.[CodSuplidor] = C.[CodSuplidorOrigen] AND S.[CodProducto] = C.[CodProducto] AND S.[Fecha] >= '" + inicio + "' AND S.[Fecha] < DATEADD(DAY, 1, '" + fin + "')), 0) AS [Cantidad] FROM CompraVentaSuplidoresCombustible C INNER JOIN Producto P ON P.[CodProducto] = C.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' WHERE C.[Estatus] = 1 AND C.[Fecha] >= '" + inicio + "' AND C.[Fecha] < DATEADD(DAY, 1, '" + fin + "') GROUP BY C.[CodSuplidorOrigen], C.[CodProducto]), Claves AS (SELECT CodSuplidor, CodProducto FROM Despachos UNION SELECT CodSuplidor, CodProducto FROM Recibos UNION SELECT CodSuplidor, CodProducto FROM OtrasEntradas UNION SELECT CodSuplidor, CodProducto FROM OtrasSalidas) SELECT K.[CodSuplidor], S.[Suplidor], K.[CodProducto], P.[Producto], CAST(0 AS DECIMAL(18,4)) AS [Inicial], ISNULL(R.[Recibos], 0) AS [Recibos], -ISNULL(D.[Despachos], 0) AS [Despachos], ISNULL(E.[Cantidad], 0) AS [OtrasEntradas], ISNULL(O.[Cantidad], 0) AS [OtrasSalidas], CAST(0 AS DECIMAL(18,4)) - ISNULL(D.[Despachos], 0) + ISNULL(R.[Recibos], 0) + ISNULL(E.[Cantidad], 0) - ISNULL(O.[Cantidad], 0) AS [FinalTeorico] FROM Claves K INNER JOIN Suplidor S ON S.[CodSuplidor] = K.[CodSuplidor] AND S.[Estatus] = 1 INNER JOIN Producto P ON P.[CodProducto] = K.[CodProducto] AND P.[Estatus] = 1 LEFT JOIN Despachos D ON D.[CodSuplidor] = K.[CodSuplidor] AND D.[CodProducto] = K.[CodProducto] LEFT JOIN Recibos R ON R.[CodSuplidor] = K.[CodSuplidor] AND R.[CodProducto] = K.[CodProducto] LEFT JOIN OtrasEntradas E ON E.[CodSuplidor] = K.[CodSuplidor] AND E.[CodProducto] = K.[CodProducto] LEFT JOIN OtrasSalidas O ON O.[CodSuplidor] = K.[CodSuplidor] AND O.[CodProducto] = K.[CodProducto] ORDER BY S.[Suplidor], P.[Producto]";
            consulta = consulta.Replace("-ISNULL(D.[Despachos], 0) AS [Despachos]", "ISNULL(D.[Despachos], 0) AS [Despachos]");
            consulta = consulta.Replace("INNER JOIN Producto P ON P.[CodProducto] = K.[CodProducto] AND P.[Estatus] = 1 LEFT JOIN Despachos D", "INNER JOIN Producto P ON P.[CodProducto] = K.[CodProducto] AND P.[Estatus] = 1 AND UPPER(LTRIM(RTRIM(P.[Tipo]))) = 'BASE' LEFT JOIN Despachos D");
            using DB db = new(); db.Conectar(); db.CrearComando(consulta); db.cmd!.CommandTimeout = 180; using SqlDataReader reader = db.EjecutarReader(); List<MovComStandarFilaDTO> filas = new();
            while (reader.Read()) filas.Add(new MovComStandarFilaDTO { CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]), Suplidor = reader["Suplidor"].ToString() ?? "", CodProducto = Convert.ToInt32(reader["CodProducto"]), Producto = reader["Producto"].ToString() ?? "", Inicial = Convert.ToDecimal(reader["Inicial"]), Recibos = Convert.ToDecimal(reader["Recibos"]), Despachos = Convert.ToDecimal(reader["Despachos"]), OtrasEntradas = Convert.ToDecimal(reader["OtrasEntradas"]), OtrasSalidas = Convert.ToDecimal(reader["OtrasSalidas"]), FinalTeorico = Convert.ToDecimal(reader["FinalTeorico"]) });
            List<MovComStandarFilaDTO> saldosIniciales = ListarSaldosIniciales(fechaInicial, true);
            foreach (MovComStandarFilaDTO saldoInicial in saldosIniciales)
            {
                MovComStandarFilaDTO? fila = filas.FirstOrDefault(item => item.CodSuplidor == saldoInicial.CodSuplidor && item.CodProducto == saldoInicial.CodProducto);
                if (fila == null)
                {
                    fila = new MovComStandarFilaDTO
                    {
                        CodSuplidor = saldoInicial.CodSuplidor,
                        Suplidor = saldoInicial.Suplidor,
                        CodProducto = saldoInicial.CodProducto,
                        Producto = saldoInicial.Producto
                    };
                    filas.Add(fila);
                }
                fila.Inicial = saldoInicial.Inicial;
            }
            List<MovComStandarFilaDTO> salidasNoIncluidas = ListarSalidasAmbienteNoIncluidas(fechaInicial, fechaFinal);
            foreach (MovComStandarFilaDTO salida in salidasNoIncluidas)
            {
                MovComStandarFilaDTO? fila = filas.FirstOrDefault(item => item.CodSuplidor == salida.CodSuplidor && item.CodProducto == salida.CodProducto);
                if (fila == null)
                {
                    fila = new MovComStandarFilaDTO
                    {
                        CodSuplidor = salida.CodSuplidor,
                        Suplidor = salida.Suplidor,
                        CodProducto = salida.CodProducto,
                        Producto = salida.Producto
                    };
                    filas.Add(fila);
                }
                fila.OtrasSalidas += salida.OtrasSalidas;
            }
            foreach (MovComStandarFilaDTO fila in filas)
                fila.FinalTeorico = fila.Inicial + fila.Recibos - fila.Despachos + fila.OtrasEntradas - fila.OtrasSalidas;
            using DB catalogoDb = new();
            List<(int Codigo, string Nombre)> suplidores = ListarOpciones(catalogoDb, "SELECT CodSuplidor Codigo,Suplidor Nombre FROM Suplidor WHERE Estatus=1 ORDER BY Suplidor");
            List<(int Codigo, string Nombre)> productos = ListarOpciones(catalogoDb, "SELECT CodProducto Codigo,Producto Nombre FROM Producto WHERE Estatus=1 AND UPPER(Tipo)=N'BASE' ORDER BY CodProducto").Take(3).ToList();
            foreach ((int codigoSuplidor, string suplidor) in suplidores)
                foreach ((int codigoProducto, string producto) in productos)
                    if (!filas.Any(fila => fila.CodSuplidor == codigoSuplidor && fila.CodProducto == codigoProducto))
                        filas.Add(new MovComStandarFilaDTO { CodSuplidor = codigoSuplidor, Suplidor = suplidor, CodProducto = codigoProducto, Producto = producto });
            filas = filas.OrderBy(fila => fila.Suplidor).ThenBy(fila => fila.CodProducto).ToList();
            return filas;
        }

        internal List<MovComStandarFilaDTO> Generar(DateTime fechaInicial, DateTime fechaFinal)
        {
            const string procedimiento = "dbo.MovComStandar";
            string consulta = "EXEC " + procedimiento
                + " '" + fechaInicial.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "'"
                + ", '" + fechaFinal.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "'";
            List<Dictionary<string, object?>> resultado = new();

            using DB db = new();
            db.Conectar();
            db.CrearComando(consulta);

            using (SqlDataReader reader = db.EjecutarReader())
            {
                while (reader.Read())
                {
                    Dictionary<string, object?> fila = new(StringComparer.OrdinalIgnoreCase);
                    for (int indice = 0; indice < reader.FieldCount; indice++)
                        fila[reader.GetName(indice)] = reader.IsDBNull(indice) ? null : reader.GetValue(indice);

                    resultado.Add(fila);
                }
            }

            List<MovComStandarFilaDTO> filas = resultado
                .Select(CrearFila)
                .Where(fila => fila != null)
                .Cast<MovComStandarFilaDTO>()
                .GroupBy(fila => new { fila.CodSuplidor, fila.Suplidor, fila.CodProducto, fila.Producto })
                .Select(grupo => new MovComStandarFilaDTO
                {
                    CodSuplidor = grupo.Key.CodSuplidor,
                    Suplidor = grupo.Key.Suplidor,
                    CodProducto = grupo.Key.CodProducto,
                    Producto = grupo.Key.Producto,
                    Inicial = grupo.Sum(fila => fila.Inicial),
                    Recibos = grupo.Sum(fila => fila.Recibos),
                    Despachos = grupo.Sum(fila => fila.Despachos),
                    OtrasEntradas = grupo.Sum(fila => fila.OtrasEntradas),
                    OtrasSalidas = grupo.Sum(fila => fila.OtrasSalidas),
                    FinalTeorico = grupo.Sum(fila => fila.FinalTeorico),
                    FisicoTanques = grupo.Max(fila => fila.FisicoTanques),
                    TuberiaInterna = grupo.Max(fila => fila.TuberiaInterna)
                })
                .OrderBy(fila => fila.Suplidor)
                .ThenBy(fila => fila.CodProducto)
                .ToList();

            // El reporte debe mostrar los cuatro suplidores aun cuando uno no tenga
            // movimientos en el rango seleccionado; sus tres productos quedan en cero.
            List<(int Codigo, string Nombre)> suplidores = ListarOpciones(db, "SELECT CodSuplidor Codigo,Suplidor Nombre FROM Suplidor WHERE Estatus=1 ORDER BY Suplidor");
            List<(int Codigo, string Nombre)> productos = ListarOpciones(db, "SELECT CodProducto Codigo,Producto Nombre FROM Producto WHERE Estatus=1 AND (UPPER(Tipo)=N'BASE' OR UPPER(Tipo)=N'ETANOL') ORDER BY CodProducto");
            List<MovComStandarFilaDTO> resultadoCompleto = suplidores.SelectMany(suplidor => productos.Select(producto =>
                filas.FirstOrDefault(fila => fila.CodSuplidor == suplidor.Codigo && fila.CodProducto == producto.Codigo)
                ?? new MovComStandarFilaDTO { CodSuplidor = suplidor.Codigo, Suplidor = suplidor.Nombre, CodProducto = producto.Codigo, Producto = producto.Nombre }
            )).ToList();

            Dictionary<int, decimal> fisicoTanques = ListarFisicoTanques(fechaInicial, fechaFinal);

            foreach (MovComStandarFilaDTO fila in resultadoCompleto)
            {
                fila.FinalTeorico = fila.Inicial + fila.Recibos - fila.Despachos + fila.OtrasEntradas - fila.OtrasSalidas;
                fila.FisicoTanques = fisicoTanques.GetValueOrDefault(fila.CodProducto);
            }
            return resultadoCompleto;
        }

        private static List<(int Codigo, string Nombre)> ListarOpciones(DB db, string consulta)
        {
            db.Conectar();
            db.CrearComando(consulta);
            using SqlDataReader reader = db.EjecutarReader();
            List<(int Codigo, string Nombre)> resultado = new();
            while (reader.Read()) resultado.Add((Convert.ToInt32(reader["Codigo"]), reader["Nombre"].ToString() ?? ""));
            return resultado;
        }

        private static MovComStandarFilaDTO? CrearFila(Dictionary<string, object?> fila)
        {
            if (!fila.TryGetValue("CodSuplidor", out object? valorSuplidor) || valorSuplidor == null) return null;
            int codSuplidor = Convert.ToInt32(valorSuplidor);
            decimal numero(string nombre) => fila.TryGetValue(nombre, out object? valor) && valor != null ? Convert.ToDecimal(valor, CultureInfo.InvariantCulture) : 0;
            return new MovComStandarFilaDTO { CodSuplidor = codSuplidor, Suplidor = fila.GetValueOrDefault("Suplidor")?.ToString() ?? "Sin suplidor", CodProducto = Convert.ToInt32(fila.GetValueOrDefault("CodProducto") ?? 0), Producto = fila.GetValueOrDefault("Producto")?.ToString() ?? "", Inicial = numero("Inicial"), Recibos = numero("Recibos"), Despachos = numero("Despachos"), OtrasEntradas = numero("OtrasEntradas"), OtrasSalidas = numero("OtrasSalidas"), FinalTeorico = numero("FinalTeorico"), FisicoTanques = numero("FisicoTanques"), TuberiaInterna = numero("TuberiaInterna") };
        }
    }
}
