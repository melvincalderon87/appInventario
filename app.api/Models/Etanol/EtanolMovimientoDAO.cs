using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.Etanol;

internal sealed class EtanolMovimientoDAO
{
    private readonly DAL dal = new();

    internal sealed record Definicion(string Tipo, string Tabla, string Llave, Menus Menu, bool EsTraslado = false, bool EsTuberia = false);

    private static readonly IReadOnlyDictionary<string, Definicion> Definiciones = new Dictionary<string, Definicion>(StringComparer.OrdinalIgnoreCase)
    {
        ["entrada"] = new("entrada", "EntradasEtanol", "CodEntradasEtanol", Menus.EtanolEntrada),
        ["salida"] = new("salida", "SalidasEtanol", "CodSalidasEtanol", Menus.EtanolSalida),
        ["compraventa"] = new("compraventa", "CompraVentaSuplidoresEtanol", "CodCompraVentaSuplidoresEtanol", Menus.EtanolCompraVentaSuplidores, true),
        ["tuberias"] = new("tuberias", "IngresoTuberiasEtanol", "CodIngresoTuberiasEtanol", Menus.EtanolIngresoTuberias, false, true),
        ["unidad-entrada"] = new("unidad-entrada", "UnidadEntradaEtanol", "CodUnidadEntradaEtanol", Menus.EtanolEntradaUnidad),
        ["unidad-salida"] = new("unidad-salida", "UnidadSalidaEtanol", "CodUnidadSalidaEtanol", Menus.EtanolSalidaUnidad),
        ["ajuste-entrada"] = new("ajuste-entrada", "AjusteEntradaEtanol", "CodAjusteEntradaEtanol", Menus.EtanolAjusteEntrada),
        ["ajuste-salida"] = new("ajuste-salida", "AjusteSalidaEtanol", "CodAjusteSalidaEtanol", Menus.EtanolAjusteSalida)
    };

    internal bool TryObtenerDefinicion(string tipo, out Definicion definicion) => Definiciones.TryGetValue(tipo ?? "", out definicion!);

    internal PaginacionResultado<EtanolMovimientoDTO> Listado(Definicion d, int page, int pageSize, string search, string sort)
    {
        PaginacionParametros p = PaginacionParametros.Crear(page, pageSize, search, sort);
        int total = 0;
        List<EtanolMovimientoDTO> items = dal.EjecutarReader(QueryListado(d, p), reader =>
        {
            if (total == 0) total = PaginacionSql.LeerTotal(reader);
            return new EtanolMovimientoDTO
            {
                Codigo = Convert.ToInt32(reader["Codigo"]),
                Fecha = Convert.ToDateTime(reader["Fecha"]),
                CodSuplidor = reader["CodSuplidor"].ToString() ?? "",
                CodSuplidorOrigen = reader["CodSuplidorOrigen"].ToString() ?? "",
                CodSuplidorDestino = reader["CodSuplidorDestino"].ToString() ?? "",
                CodProducto = reader["CodProducto"].ToString() ?? "",
                CodBarco = reader["CodBarco"] == DBNull.Value ? 0 : Convert.ToInt32(reader["CodBarco"]),
                CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]),
                CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"]),
                SiglasUnidad = reader["SiglasUnidad"].ToString() ?? "",
                Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"])
            };
        });
        return new(items, total, p.Page, p.PageSize);
    }

    internal int ObtenerKey(Definicion d) => dal.EjecutarScalar($"SELECT ISNULL(MAX([{d.Llave}]),0)+1 FROM [{d.Tabla}]", 1);

    internal List<SelectListItem> ListarProductosEtanol() => dal.EjecutarReader(
        "SELECT P.CodProducto, P.Producto FROM Producto P INNER JOIN TipoProducto T ON T.CodTipoProducto=P.CodTipoProducto WHERE UPPER(T.Descripcion)=UPPER('Etanol') ORDER BY P.Producto",
        r => new SelectListItem { Value = r["CodProducto"].ToString(), Text = r["Producto"].ToString() });

    internal MsjDB Agregar(Definicion d, EtanolMovimientoDTO x)
    {
        string? error = Validar(d, x);
        if (error != null) return new MsjDB { Estatus = false, Msj = error };
        int codigo = ObtenerKey(d);
        MsjDB respuesta = Guardar(d, x, codigo, false);
        if (respuesta.Estatus) AutorizacionDocumentos.RegistrarPendiente((int)d.Menu, codigo);
        return respuesta;
    }

    internal EtanolMovimientoDTO? Obtener(Definicion d, int codigo)
    {
        if (codigo <= 0) return null;
        return dal.EjecutarReader(QueryListado(d, PaginacionParametros.Crear(1, 1, "", ""), codigo), reader => new EtanolMovimientoDTO
        {
            Codigo = Convert.ToInt32(reader["Codigo"]),
            Fecha = Convert.ToDateTime(reader["Fecha"]),
            CodSuplidor = reader["CodSuplidor"].ToString() ?? "",
            CodSuplidorOrigen = reader["CodSuplidorOrigen"].ToString() ?? "",
            CodSuplidorDestino = reader["CodSuplidorDestino"].ToString() ?? "",
            CodProducto = reader["CodProducto"].ToString() ?? "",
            CodBarco = reader["CodBarco"] == DBNull.Value ? 0 : Convert.ToInt32(reader["CodBarco"]),
            CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]),
            CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"]),
            SiglasUnidad = reader["SiglasUnidad"].ToString() ?? "",
            Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"])
        }).FirstOrDefault();
    }

    private MsjDB Guardar(Definicion d, EtanolMovimientoDTO x, int codigo, bool temporal)
    {
        string usuario = Sql(new VerificarUsuario().SesionUsuario());
        string fecha = x.Fecha!.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
        string columnas = $"[{d.Llave}],[Fecha],";
        string valores = $"{codigo},'{fecha}',";
        if (d.EsTraslado)
        {
            columnas += "[CodSuplidorOrigen],[CodSuplidorDestino],";
            valores += $"N'{Sql(x.CodSuplidorOrigen)}',N'{Sql(x.CodSuplidorDestino)}',";
        }
        else
        {
            columnas += "[CodSuplidor],";
            valores += $"N'{Sql(x.CodSuplidor)}',";
        }
        if (d.EsTuberia) { columnas += "[CodBarco],"; valores += $"{x.CodBarco},"; }
        columnas += "[CodProducto],[CantidadEstandar],[CantidadAmbiente]";
        valores += $"N'{Sql(x.CodProducto)}',{x.CantidadEstandar.ToString(CultureInfo.InvariantCulture)},{x.CantidadAmbiente.ToString(CultureInfo.InvariantCulture)}";
        if (!d.EsTraslado && !d.EsTuberia) { columnas += ",[SiglasUnidad]"; valores += $",N'{Sql(x.SiglasUnidad)}'"; }
        if (!NoUsaEstatus(d))
        {
            columnas += ",[Estatus]";
            valores += ",1";
        }
        columnas += ",[Version],[CodUsuarioCreacion],[FechaCreacion],[AccionLog]";
        valores += $",1,N'{usuario}',GETDATE(),'C'";
        return dal.Ejecutar($"INSERT INTO [{d.Tabla}] ({columnas}) VALUES ({valores})", false, temporal ? TipoDAL.Editar : TipoDAL.Agregar);
    }

    internal MsjDB Editar(Definicion d, EtanolMovimientoDTO x)
    {
        if (x.Codigo <= 0) return new MsjDB { Estatus = false, Msj = "El código es requerido." };
        string? error = Validar(d, x); if (error != null) return new MsjDB { Estatus = false, Msj = error };
        if (!AutorizacionDocumentos.HayAutorizador((int)d.Menu)) return EditarOriginal(d, x);
        if (dal.EjecutarExiste($"SELECT 1 FROM [{d.Tabla}] WHERE [{d.Llave}]={-x.Codigo}")) return new MsjDB { Estatus = false, Msj = "Ya existe una edición pendiente de autorización para este documento." };
        MsjDB temporal = Guardar(d, x, -x.Codigo, true);
        if (temporal.Estatus) AutorizacionDocumentos.RegistrarPendiente((int)d.Menu, -x.Codigo);
        return temporal;
    }

    private MsjDB EditarOriginal(Definicion d, EtanolMovimientoDTO x)
    {
        string fecha = x.Fecha!.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
        string set = $"[Fecha]='{fecha}',[CodProducto]=N'{Sql(x.CodProducto)}',[CantidadEstandar]={x.CantidadEstandar.ToString(CultureInfo.InvariantCulture)},[CantidadAmbiente]={x.CantidadAmbiente.ToString(CultureInfo.InvariantCulture)},[Version]=[Version]+1,[CodUsuarioActualizacion]=N'{Sql(new VerificarUsuario().SesionUsuario())}',[FechaActualizacion]=GETDATE(),[AccionLog]='U'";
        set += d.EsTraslado ? $",[CodSuplidorOrigen]=N'{Sql(x.CodSuplidorOrigen)}',[CodSuplidorDestino]=N'{Sql(x.CodSuplidorDestino)}'" : $",[CodSuplidor]=N'{Sql(x.CodSuplidor)}'";
        if (d.EsTuberia) set += $",[CodBarco]={x.CodBarco}";
        if (!d.EsTraslado && !d.EsTuberia) set += $",[SiglasUnidad]=N'{Sql(x.SiglasUnidad)}'";
        string condicionEstatus = NoUsaEstatus(d) ? "" : " AND [Estatus]=1";
        return dal.Ejecutar($"UPDATE [{d.Tabla}] SET {set} WHERE [{d.Llave}]={x.Codigo}{condicionEstatus}", false, TipoDAL.Editar);
    }

    internal MsjDB Eliminar(Definicion d, int codigo)
    {
        if (codigo <= 0) return new MsjDB { Estatus = false, Msj = "El código es requerido." };
        if (NoUsaEstatus(d))
            return dal.Ejecutar($"DELETE FROM [{d.Tabla}] WHERE [{d.Llave}]={codigo}", false, TipoDAL.Eliminar);
        return dal.Ejecutar($"UPDATE [{d.Tabla}] SET [Estatus]=0,[Version]=[Version]+1,[CodUsuarioEliminacion]=N'{Sql(new VerificarUsuario().SesionUsuario())}',[FechaEliminacion]=GETDATE(),[AccionLog]='D' WHERE [{d.Llave}]={codigo} AND [Estatus]=1", false, TipoDAL.Eliminar);
    }

    private string QueryListado(Definicion d, PaginacionParametros p, int? codigo = null)
    {
        string suplidor = d.EsTraslado ? "N''" : "A.[CodSuplidor]";
        string origen = d.EsTraslado ? "A.[CodSuplidorOrigen]" : "N''";
        string destino = d.EsTraslado ? "A.[CodSuplidorDestino]" : "N''";
        string barco = d.EsTuberia ? "A.[CodBarco]" : "NULL";
        string unidad = !d.EsTraslado && !d.EsTuberia ? "A.[SiglasUnidad]" : "N''";
        string baseWhere = (NoUsaEstatus(d) ? "WHERE A.[" + d.Llave + "]>0 " : "WHERE A.[Estatus]=1 AND A.[" + d.Llave + "]>0 ");
        string where = codigo.HasValue ? baseWhere + "AND A.[" + d.Llave + "]=" + codigo.Value + " " : baseWhere + PaginacionSql.WhereBusqueda(p.Search, new[] { $"CONVERT(VARCHAR(20),A.[{d.Llave}])", "CONVERT(VARCHAR(10),A.[Fecha],103)", "A.[CodProducto]", d.EsTraslado ? "A.[CodSuplidorOrigen]" : "A.[CodSuplidor]" });
        string order = PaginacionSql.OrderBy(p.Sort, new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["codigo"] = $"A.[{d.Llave}]", ["fecha"] = "A.[Fecha]", ["producto"] = "A.[CodProducto]" }, $"A.[Fecha] DESC,A.[{d.Llave}] DESC");
        string estatus = NoUsaEstatus(d) ? "CAST(1 AS bit)" : "A.[Estatus]";
        return $"SELECT A.[{d.Llave}] Codigo,A.[Fecha],{suplidor} CodSuplidor,{origen} CodSuplidorOrigen,{destino} CodSuplidorDestino,A.[CodProducto],{barco} CodBarco,A.[CantidadEstandar],A.[CantidadAmbiente],{unidad} SiglasUnidad,{estatus} Estatus,COUNT(1) OVER() AS [{PaginacionSql.TotalRegistrosAlias}] FROM [{d.Tabla}] A {where} ORDER BY {order}{PaginacionSql.OffsetFetch(p)}";
    }

    private bool EsProductoEtanol(string codigo) => dal.EjecutarExiste($"SELECT 1 FROM Producto P INNER JOIN TipoProducto T ON T.CodTipoProducto=P.CodTipoProducto WHERE CONVERT(NVARCHAR(40),P.CodProducto)=N'{Sql(codigo)}' AND UPPER(T.Descripcion)=UPPER('Etanol')");
    private string? Validar(Definicion d, EtanolMovimientoDTO x)
    {
        if (!x.Fecha.HasValue || string.IsNullOrWhiteSpace(x.CodProducto) || x.CantidadEstandar < 0 || x.CantidadAmbiente < 0) return "Fecha, producto y cantidades válidas son requeridos.";
        if (d.EsTraslado ? string.IsNullOrWhiteSpace(x.CodSuplidorOrigen) || string.IsNullOrWhiteSpace(x.CodSuplidorDestino) : string.IsNullOrWhiteSpace(x.CodSuplidor)) return "El suplidor es requerido.";
        if (d.EsTuberia && x.CodBarco <= 0) return "El barco es requerido.";
        return EsProductoEtanol(x.CodProducto) ? null : "El producto seleccionado debe ser de tipo Etanol.";
    }
    private static string Sql(string? valor) => (valor ?? "").Replace("'", "''");
    private static bool NoUsaEstatus(Definicion d) => d.Tabla is "EntradasEtanol" or "SalidasEtanol";
}
