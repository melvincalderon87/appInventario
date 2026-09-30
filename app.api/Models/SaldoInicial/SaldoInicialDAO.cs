using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.SaldoInicial
{
    /// <summary>Acceso a datos del modulo SaldoInicial.</summary>
    internal class SaldoInicialDAO
    {
        private readonly DAL db = new DAL();
        private readonly Encriptacion encryption = new Encriptacion();

        internal void Inicializar()
        {
            db.Ejecutar("IF OBJECT_ID('dbo.SaldoInicial','U') IS NULL CREATE TABLE dbo.SaldoInicial (CodSaldoInicial INT NOT NULL PRIMARY KEY,Tipo NVARCHAR(20) NOT NULL,CodSuplidor INT NULL,CodProducto INT NULL,Fecha DATE NOT NULL,CantidadEstandar DECIMAL(18,4) NULL,CantidadAmbiente DECIMAL(18,4) NULL,Cantidad DECIMAL(18,4) NULL,Estatus BIT NOT NULL,Version INT NOT NULL,CodUsuarioCreacion NVARCHAR(450) NULL,FechaCreacion DATETIME NULL,CodUsuarioActualizacion NVARCHAR(450) NULL,FechaActualizacion DATETIME NULL,CodUsuarioEliminacion NVARCHAR(450) NULL,FechaEliminacion DATETIME NULL,AccionLog NVARCHAR(1) NOT NULL); IF COL_LENGTH('dbo.SaldoInicial','Fecha') IS NULL ALTER TABLE dbo.SaldoInicial ADD Fecha DATE NULL; IF OBJECT_ID('dbo.SaldoInicial_LOG','U') IS NULL CREATE TABLE dbo.SaldoInicial_LOG (CodSaldoInicial INT NOT NULL,Tipo NVARCHAR(20) NOT NULL,CodSuplidor INT NULL,CodProducto INT NULL,Fecha DATE NULL,CantidadEstandar DECIMAL(18,4) NULL,CantidadAmbiente DECIMAL(18,4) NULL,Cantidad DECIMAL(18,4) NULL,Estatus BIT NOT NULL,Version INT NOT NULL,CodUsuarioCreacion NVARCHAR(450) NULL,FechaCreacion DATETIME NULL,CodUsuarioActualizacion NVARCHAR(450) NULL,FechaActualizacion DATETIME NULL,CodUsuarioEliminacion NVARCHAR(450) NULL,FechaEliminacion DATETIME NULL,AccionLog NVARCHAR(1) NOT NULL); IF COL_LENGTH('dbo.SaldoInicial_LOG','Fecha') IS NULL ALTER TABLE dbo.SaldoInicial_LOG ADD Fecha DATE NULL;", Key: false);
            db.Ejecutar("SET ANSI_NULLS ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON; SET ARITHABORT ON; SET CONCAT_NULL_YIELDS_NULL ON; SET QUOTED_IDENTIFIER ON; SET NUMERIC_ROUNDABORT OFF; IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_SaldoInicial_Tipo_Fecha' AND object_id=OBJECT_ID('dbo.SaldoInicial')) CREATE UNIQUE INDEX UX_SaldoInicial_Tipo_Fecha ON dbo.SaldoInicial (Tipo,Fecha) WHERE Fecha IS NOT NULL;", Key: false);
        }

        internal PaginacionResultado<SaldoInicialDTO> Listado(string tipo, int page, int pageSize, string search, string sort)
        {
            Inicializar();
            var pagination = PaginacionParametros.Crear(page, pageSize, search, sort);
            int total = 0;
            var items = db.EjecutarReader(QueryListado(tipo, pagination), r => { if (total == 0) total = PaginacionSql.LeerTotal(r); return Map(r); });
            return new PaginacionResultado<SaldoInicialDTO>(items, total, pagination.Page, pagination.PageSize);
        }

        internal List<SelectListItem> ListarSuplidores() => Opciones("SELECT CodSuplidor Codigo,Suplidor Descripcion FROM Suplidor ORDER BY Suplidor");
        internal List<SelectListItem> ListarProductos(string tipo) => Opciones("SELECT P.CodProducto Codigo,P.Producto Descripcion FROM Producto P INNER JOIN TipoProducto T ON T.CodTipoProducto=P.CodTipoProducto WHERE UPPER(T.Descripcion)=UPPER(N'" + Sql(tipo) + "') ORDER BY P.Producto");
        internal int SiguienteCorrelativo() { Inicializar(); return db.EjecutarScalar("SELECT ISNULL(MAX(CodSaldoInicial),0)+1 FROM SaldoInicial", 1); }

        internal SaldoInicialDTO Obtener(int codSaldoInicial)
        {
            Inicializar();
            return db.EjecutarReader(
                "SELECT CodSaldoInicial,Tipo,CodSuplidor,CodProducto,Fecha,CantidadEstandar,CantidadAmbiente,Cantidad,FechaCreacion FROM SaldoInicial WHERE CodSaldoInicial=" + codSaldoInicial,
                Map).FirstOrDefault() ?? new SaldoInicialDTO();
        }

        internal MsjDB Agregar(SaldoInicialDTO obj)
        {
            Inicializar();
            string tipo = (obj.Tipo ?? "").Trim().ToUpperInvariant();
            if (tipo is not ("COMBUSTIBLE" or "ADITIVO" or "COLORANTE")) return Error("El tipo de saldo inicial no es válido.");
            if (!obj.Fecha.HasValue) return Error("El mes del saldo inicial es requerido.");
            obj.Fecha = new DateTime(obj.Fecha.Value.Year, obj.Fecha.Value.Month, 1);
            if (obj.CodProducto <= 0) return Error("El producto es requerido.");
            if (tipo == "COMBUSTIBLE" && obj.CodSuplidor <= 0) return Error("El suplidor es requerido.");
            if (!EsProductoDelTipo(obj.CodProducto, tipo)) return Error("El producto seleccionado no corresponde al tipo de saldo inicial.");
            if (tipo == "COMBUSTIBLE" && (obj.CantidadEstandar < 0 || obj.CantidadAmbiente < 0)) return Error("Las cantidades deben ser mayores o iguales a cero.");
            if (tipo != "COMBUSTIBLE" && obj.Cantidad < 0) return Error("La cantidad debe ser mayor o igual a cero.");

            string fecha = obj.Fecha.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            if (db.EjecutarExiste("SELECT 1 FROM SaldoInicial WHERE Tipo=N'" + Sql(tipo) + "' AND Fecha='" + fecha + "'")) return Error("Ya existe un saldo inicial para este mes.");

            int key = SiguienteCorrelativo();
            string usuario = new VerificarUsuario().SesionUsuario();
            string sql = $"INSERT INTO SaldoInicial (CodSaldoInicial,Tipo,CodSuplidor,CodProducto,Fecha,CantidadEstandar,CantidadAmbiente,Cantidad,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES ({key},N'{Sql(tipo)}',{NullInt(obj.CodSuplidor)},{NullInt(obj.CodProducto)},'{fecha}',{Numero(obj.CantidadEstandar)},{Numero(obj.CantidadAmbiente)},{Numero(obj.Cantidad)},1,1,N'{Sql(usuario)}',GETDATE(),'C')";
            return db.Ejecutar(sql, Key: false, tipoDAL: TipoDAL.Agregar);
        }

        internal MsjDB Editar(SaldoInicialDTO obj)
        {
            Inicializar();
            if (obj.CodSaldoInicial <= 0 || !db.EjecutarExiste("SELECT 1 FROM SaldoInicial WHERE CodSaldoInicial=" + obj.CodSaldoInicial)) return Error("El saldo inicial no existe.");

            string tipo = (obj.Tipo ?? "").Trim().ToUpperInvariant();
            if (tipo is not ("COMBUSTIBLE" or "ADITIVO" or "COLORANTE")) return Error("El tipo de saldo inicial no es válido.");
            if (!obj.Fecha.HasValue) return Error("El mes del saldo inicial es requerido.");
            obj.Fecha = new DateTime(obj.Fecha.Value.Year, obj.Fecha.Value.Month, 1);
            if (obj.CodProducto <= 0 || !EsProductoDelTipo(obj.CodProducto, tipo)) return Error("El producto seleccionado no corresponde al tipo de saldo inicial.");
            if (tipo == "COMBUSTIBLE" && obj.CodSuplidor <= 0) return Error("El suplidor es requerido.");
            if (tipo == "COMBUSTIBLE" && (obj.CantidadEstandar < 0 || obj.CantidadAmbiente < 0)) return Error("Las cantidades deben ser mayores o iguales a cero.");
            if (tipo != "COMBUSTIBLE" && obj.Cantidad < 0) return Error("La cantidad debe ser mayor o igual a cero.");

            string fecha = obj.Fecha.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            if (db.EjecutarExiste("SELECT 1 FROM SaldoInicial WHERE Tipo=N'" + Sql(tipo) + "' AND Fecha='" + fecha + "' AND CodSaldoInicial<>" + obj.CodSaldoInicial)) return Error("Ya existe un saldo inicial para este mes.");

            string usuario = new VerificarUsuario().SesionUsuario();
            string sql = $"UPDATE SaldoInicial SET CodSuplidor={NullInt(obj.CodSuplidor)},CodProducto={NullInt(obj.CodProducto)},Fecha='{fecha}',CantidadEstandar={Numero(obj.CantidadEstandar)},CantidadAmbiente={Numero(obj.CantidadAmbiente)},Cantidad={Numero(obj.Cantidad)},Version=Version+1,CodUsuarioActualizacion=N'{Sql(usuario)}',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodSaldoInicial={obj.CodSaldoInicial}";
            return db.Ejecutar(sql, Key: false, tipoDAL: TipoDAL.Editar);
        }

        private bool EsProductoDelTipo(int codProducto, string tipo) => db.EjecutarExiste(
            "SELECT 1 FROM Producto P INNER JOIN TipoProducto T ON T.CodTipoProducto=P.CodTipoProducto "
            + "WHERE P.CodProducto=" + codProducto + " AND UPPER(T.Descripcion)=UPPER(N'" + Sql(tipo) + "')");

        private List<SelectListItem> Opciones(string query) => db.EjecutarReader(query, r => new SelectListItem { Value = r["Codigo"].ToString(), Text = r["Descripcion"].ToString() });
        private string QueryListado(string tipo, PaginacionParametros p)
        {
            string where = "WHERE A.Tipo=N'" + Sql(tipo.ToUpperInvariant()) + "' " + PaginacionSql.WhereBusqueda(p.Search, new[] { "CONVERT(VARCHAR(20),A.CodSaldoInicial)", "CONVERT(VARCHAR(10),A.Fecha,103)", "S.Suplidor", "P.Producto", "CONVERT(VARCHAR(30),A.CantidadEstandar)", "CONVERT(VARCHAR(30),A.CantidadAmbiente)", "CONVERT(VARCHAR(30),A.Cantidad)" });
            var columns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["codSaldoInicial"] = "A.CodSaldoInicial", ["fecha"] = "A.Fecha", ["suplidor"] = "S.Suplidor", ["producto"] = "P.Producto" };
            return "SELECT A.CodSaldoInicial,A.Tipo,A.CodSuplidor,ISNULL(S.Suplidor,'') Suplidor,A.CodProducto,ISNULL(P.Producto,'') Producto,A.Fecha,A.CantidadEstandar,A.CantidadAmbiente,A.Cantidad,A.FechaCreacion,COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] FROM SaldoInicial A LEFT JOIN Suplidor S ON S.CodSuplidor=A.CodSuplidor LEFT JOIN Producto P ON P.CodProducto=A.CodProducto " + where + " ORDER BY " + PaginacionSql.OrderBy(p.Sort, columns, "A.Fecha DESC,A.CodSaldoInicial DESC") + PaginacionSql.OffsetFetch(p);
        }
        private SaldoInicialDTO Map(SqlDataReader r) => new() { CodSaldoInicial = Convert.ToInt32(r["CodSaldoInicial"]), IdSaldoInicial = encryption.Encriptar(r["CodSaldoInicial"].ToString()!), Tipo = r["Tipo"].ToString()!, CodSuplidor = Int(r["CodSuplidor"]), Suplidor = r["Suplidor"].ToString()!, CodProducto = Int(r["CodProducto"]), Producto = r["Producto"].ToString()!, Fecha = Date(r["Fecha"]), CantidadEstandar = Decimal(r["CantidadEstandar"]), CantidadAmbiente = Decimal(r["CantidadAmbiente"]), Cantidad = Decimal(r["Cantidad"]), FechaCreacion = Date(r["FechaCreacion"]) };
        private static int Int(object value) => value == DBNull.Value ? 0 : Convert.ToInt32(value);
        private static decimal Decimal(object value) => value == DBNull.Value ? 0 : Convert.ToDecimal(value);
        private static DateTime? Date(object value) => value == DBNull.Value ? null : Convert.ToDateTime(value);
        private static string Sql(string? value) => (value ?? "").Replace("'", "''");
        private static string NullInt(int value) => value > 0 ? value.ToString() : "NULL";
        private static string Numero(decimal value) => value.ToString(CultureInfo.InvariantCulture);
        private static MsjDB Error(string message) => new() { Estatus = false, Msj = message, Key = 0 };
    }
}
