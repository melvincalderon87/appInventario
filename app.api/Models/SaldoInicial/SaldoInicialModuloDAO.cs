using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.SaldoInicial;

internal sealed class SaldoInicialModuloDAO
{
    private readonly DAL db = new();
    private readonly Encriptacion encryption = new();

    private static (string Tabla, string Llave, bool UsaDetalleCombustible) Definir(string tipo) => tipo switch
    {
        "COMBUSTIBLE" => ("SaldoInicialCombustible", "CodSaldoInicialCombustible", true),
        "ADITIVO" => ("SaldoInicialAditivo", "CodSaldoInicialAditivo", false),
        "COLORANTE" => ("SaldoInicialColorante", "CodSaldoInicialColorante", false),
        "ETANOL" => ("SaldoInicialEtanol", "CodSaldoInicialEtanol", true),
        _ => throw new ArgumentOutOfRangeException(nameof(tipo))
    };

    internal PaginacionResultado<SaldoInicialDTO> Listado(string tipo, int page, int pageSize, string search, string sort)
    {
        var d = Definir(tipo); var p = PaginacionParametros.Crear(page, pageSize, search, sort); int total = 0;
        string campos = d.UsaDetalleCombustible ? "A.CodSuplidor,ISNULL(S.Suplidor,'') Suplidor,A.CantidadEstandar,A.CantidadAmbiente,CAST(0 AS DECIMAL(18,4)) Cantidad" : "CAST(NULL AS NVARCHAR(20)) CodSuplidor,'' Suplidor,CAST(0 AS DECIMAL(18,4)) CantidadEstandar,CAST(0 AS DECIMAL(18,4)) CantidadAmbiente,A.Cantidad";
        string joins = d.UsaDetalleCombustible ? " LEFT JOIN Suplidor S ON S.CodSuplidor=A.CodSuplidor" : "";
        string where = "WHERE A.Estatus=1 " + PaginacionSql.WhereBusqueda(p.Search, new[] { "CONVERT(VARCHAR(20),A." + d.Llave + ")", "CONVERT(VARCHAR(10),A.Fecha,103)", "P.Producto" });
        string sql = "SELECT A." + d.Llave + " CodSaldoInicial," + campos + ",A.CodProducto,ISNULL(P.Producto,'') Producto,A.Fecha,A.FechaCreacion,COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] FROM " + d.Tabla + " A" + joins + " LEFT JOIN Producto P ON P.CodProducto=A.CodProducto " + where + " ORDER BY " + PaginacionSql.OrderBy(p.Sort, new Dictionary<string, string> { ["fecha"] = "A.Fecha", ["producto"] = "P.Producto" }, "A.Fecha DESC,A." + d.Llave + " DESC") + PaginacionSql.OffsetFetch(p);
        var items = db.EjecutarReader(sql, r => { if (total == 0) total = PaginacionSql.LeerTotal(r); return Map(r, tipo); });
        return new(items, total, p.Page, p.PageSize);
    }

    internal int Siguiente(string tipo) { var d = Definir(tipo); return db.EjecutarScalar("SELECT ISNULL(MAX(" + d.Llave + "),0)+1 FROM " + d.Tabla, 1); }
    internal List<SelectListItem> Productos(string tipo) => db.EjecutarReader("SELECT P.CodProducto Codigo,P.Producto Descripcion FROM Producto P INNER JOIN TipoProducto T ON T.CodTipoProducto=P.CodTipoProducto WHERE UPPER(T.Descripcion)=N'" + Sql(tipo) + "' ORDER BY P.Producto", r => new SelectListItem { Value = r["Codigo"].ToString(), Text = r["Descripcion"].ToString() });
    internal List<SelectListItem> Suplidores() => db.EjecutarReader("SELECT CodSuplidor Codigo,Suplidor Descripcion FROM Suplidor ORDER BY Suplidor", r => new SelectListItem { Value = r["Codigo"].ToString(), Text = r["Descripcion"].ToString() });
    internal SaldoInicialDTO Obtener(string tipo, int codigo)
    {
        var d = Definir(tipo); string campos = d.UsaDetalleCombustible ? "A.CodSuplidor,ISNULL(S.Suplidor,'') Suplidor,A.CantidadEstandar,A.CantidadAmbiente,CAST(0 AS DECIMAL(18,4)) Cantidad" : "CAST(NULL AS NVARCHAR(20)) CodSuplidor,'' Suplidor,CAST(0 AS DECIMAL(18,4)) CantidadEstandar,CAST(0 AS DECIMAL(18,4)) CantidadAmbiente,A.Cantidad";
        string joins = d.UsaDetalleCombustible ? " LEFT JOIN Suplidor S ON S.CodSuplidor=A.CodSuplidor" : "";
        return db.EjecutarReader("SELECT A." + d.Llave + " CodSaldoInicial," + campos + ",A.CodProducto,ISNULL(P.Producto,'') Producto,A.Fecha,A.FechaCreacion FROM " + d.Tabla + " A" + joins + " LEFT JOIN Producto P ON P.CodProducto=A.CodProducto WHERE A." + d.Llave + "=" + codigo, r => Map(r, tipo)).FirstOrDefault() ?? new();
    }
    internal MsjDB Agregar(string tipo, SaldoInicialDTO o) { if (!Validar(tipo, o, out var e)) return Error(e); var d = Definir(tipo); string f = o.Fecha!.Value.ToString("yyyy-MM-dd"); if (db.EjecutarExiste(DuplicadoSql(d, o, f))) return Error("Ya existe un saldo inicial para este mes, suplidor y producto."); int k = Siguiente(tipo); string u = Sql(new VerificarUsuario().SesionUsuario()); string sql = d.UsaDetalleCombustible ? $"INSERT INTO {d.Tabla} ({d.Llave},CodSuplidor,CodProducto,Fecha,CantidadEstandar,CantidadAmbiente,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES ({k},N'{o.CodSuplidor}',N'{o.CodProducto}','{f}',{N(o.CantidadEstandar)},{N(o.CantidadAmbiente)},1,1,N'{u}',GETDATE(),'C')" : $"INSERT INTO {d.Tabla} ({d.Llave},CodProducto,Fecha,Cantidad,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES ({k},N'{o.CodProducto}','{f}',{N(o.Cantidad)},1,1,N'{u}',GETDATE(),'C')"; return db.Ejecutar(sql, Key: false, tipoDAL: TipoDAL.Agregar); }
    internal MsjDB Editar(string tipo, SaldoInicialDTO o) { var d = Definir(tipo); if (o.CodSaldoInicial <= 0 || !db.EjecutarExiste("SELECT 1 FROM " + d.Tabla + " WHERE " + d.Llave + "=" + o.CodSaldoInicial)) return Error("El saldo inicial no existe."); if (!Validar(tipo, o, out var e)) return Error(e); string f = o.Fecha!.Value.ToString("yyyy-MM-dd"); if (db.EjecutarExiste(DuplicadoSql(d, o, f) + " AND " + d.Llave + "<>" + o.CodSaldoInicial)) return Error("Ya existe un saldo inicial para este mes, suplidor y producto."); string set = d.UsaDetalleCombustible ? $"CodSuplidor=N'{o.CodSuplidor}',CodProducto=N'{o.CodProducto}',Fecha='{f}',CantidadEstandar={N(o.CantidadEstandar)},CantidadAmbiente={N(o.CantidadAmbiente)}" : $"CodProducto=N'{o.CodProducto}',Fecha='{f}',Cantidad={N(o.Cantidad)}"; return db.Ejecutar($"UPDATE {d.Tabla} SET {set},Version=Version+1,CodUsuarioActualizacion=N'{Sql(new VerificarUsuario().SesionUsuario())}',FechaActualizacion=GETDATE(),AccionLog='U' WHERE {d.Llave}={o.CodSaldoInicial}", Key: false, tipoDAL: TipoDAL.Editar); }
    private bool Validar(string tipo, SaldoInicialDTO o, out string error) { error = ""; if (!o.Fecha.HasValue || o.CodProducto <= 0) { error = "La fecha y el producto son requeridos."; return false; } o.Fecha = new DateTime(o.Fecha.Value.Year, o.Fecha.Value.Month, 1); var d = Definir(tipo); if (d.UsaDetalleCombustible && (o.CodSuplidor <= 0 || o.CantidadEstandar < 0 || o.CantidadAmbiente < 0)) { error = "El suplidor y las cantidades son requeridos."; return false; } if (!d.UsaDetalleCombustible && o.Cantidad < 0) { error = "La cantidad es requerida."; return false; } return db.EjecutarExiste("SELECT 1 FROM Producto P INNER JOIN TipoProducto T ON T.CodTipoProducto=P.CodTipoProducto WHERE P.CodProducto=N'" + o.CodProducto + "' AND UPPER(T.Descripcion)=N'" + Sql(tipo) + "'"); }
    private static string DuplicadoSql((string Tabla, string Llave, bool UsaDetalleCombustible) d, SaldoInicialDTO o, string fecha) => "SELECT 1 FROM " + d.Tabla + " WHERE Fecha='" + fecha + "' AND CodProducto=N'" + o.CodProducto + "'" + (d.UsaDetalleCombustible ? " AND CodSuplidor=N'" + o.CodSuplidor + "'" : "");
    private SaldoInicialDTO Map(SqlDataReader r, string tipo) => new() { CodSaldoInicial = Convert.ToInt32(r["CodSaldoInicial"]), IdSaldoInicial = encryption.Encriptar(r["CodSaldoInicial"].ToString()!), Tipo = tipo, CodSuplidor = I(r["CodSuplidor"]), Suplidor = r["Suplidor"].ToString()!, CodProducto = I(r["CodProducto"]), Producto = r["Producto"].ToString()!, Fecha = D(r["Fecha"]), CantidadEstandar = X(r["CantidadEstandar"]), CantidadAmbiente = X(r["CantidadAmbiente"]), Cantidad = X(r["Cantidad"]), FechaCreacion = D(r["FechaCreacion"]) };
    private static int I(object x) => x == DBNull.Value ? 0 : Convert.ToInt32(x); private static decimal X(object x) => x == DBNull.Value ? 0 : Convert.ToDecimal(x); private static DateTime? D(object x) => x == DBNull.Value ? null : Convert.ToDateTime(x); private static string Sql(string? x) => (x ?? "").Replace("'", "''"); private static string N(decimal x) => x.ToString(CultureInfo.InvariantCulture); private static MsjDB Error(string x) => new() { Estatus = false, Msj = x };
}
