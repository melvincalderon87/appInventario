using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace app.Models.Colorante
{
    /// <summary>
    /// DAO para el mantenimiento de movimientos de colorante.
    /// </summary>
    internal class ColoranteDAO
    {
        private const string MovimientoIngreso = "INGRESO";
        private const string MovimientoAjuste = "AJUSTE";
        private const string MovimientoSalida = "SALIDA";
        private const string MovimientoInyeccion = "INYECTAR_MANIFOLD";
        private const string MovimientoPrestamo = "PRESTAMO";
        private static readonly string[] MovimientosIngreso = new[] { MovimientoIngreso, MovimientoAjuste };
        private static readonly string[] MovimientosSalida = new[] { MovimientoSalida, MovimientoInyeccion, MovimientoPrestamo };

        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<ColoranteDTO> Listado(
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "",
            string TipoMovimiento = "",
            string CodProducto = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<ColoranteDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, TipoMovimiento, CodProducto), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapColorante(reader);
            });

            return new PaginacionResultado<ColoranteDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodDocumento"].ToString()
            });
        }

        internal List<SelectListItem> ListarProductosColorante()
        {
            return ObjDAL.EjecutarReader(QueryListarProductosColorante(), reader => new SelectListItem()
            {
                Text = reader["Producto"].ToString(),
                Value = reader["CodProducto"].ToString()
            });
        }

        internal ColoranteDTO Obtener(int CodDocumento)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodDocumento), MapColorante).FirstOrDefault() ?? new ColoranteDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(ColoranteDTO Obj)
        {
            Obj.CodDocumento = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararMovimiento(Obj, TipoDAL.Agregar);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                RecalcularProducto(Obj.CodProducto);
                LogModificacionDAO.Registrar("Colorante", "CREADO", "CodDocumento:" + Obj.CodDocumento, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(ColoranteDTO Obj)
        {
            ColoranteDTO ObjAnterior = Obtener(Obj.CodDocumento);

            if (ObjAnterior.CodDocumento <= 0)
                return Error("Movimiento de colorante no encontrado.");

            Obj.Version = ObtenerVersion(Obj.CodDocumento);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararMovimiento(Obj, TipoDAL.Editar, ObjAnterior);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                if (!string.IsNullOrWhiteSpace(ObjAnterior.CodProducto) && ObjAnterior.CodProducto != Obj.CodProducto)
                    RecalcularProducto(ObjAnterior.CodProducto);

                RecalcularProducto(Obj.CodProducto);
                LogModificacionDAO.Registrar("Colorante", "EDITADO", "CodDocumento:" + Obj.CodDocumento, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(ColoranteDTO Obj)
        {
            ColoranteDTO ObjAnterior = Obtener(Obj.CodDocumento);

            if (ObjAnterior.CodDocumento <= 0)
                return Error("Movimiento de colorante no encontrado.");

            MsjDB validacion = PrepararMovimiento(ObjAnterior, TipoDAL.Eliminar, ObjAnterior);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: ObjAnterior), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                if (!string.IsNullOrWhiteSpace(ObjAnterior.CodProducto))
                    RecalcularProducto(ObjAnterior.CodProducto);

                LogModificacionDAO.Registrar("Colorante", "ELIMINADO", "CodDocumento:" + ObjAnterior.CodDocumento, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal int ObtenerVersion(int CodDocumento)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodDocumento), 1);
        }

        internal List<ColoranteDTO> Log(int CodDocumento)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodDocumento), MapColoranteLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, ColoranteDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO " + TablaMovimiento(Obj!) + " (" + LlaveMovimiento(Obj!) + ",CodProducto,Fecha,TipoMovimiento,CodBarco,CodSuplidor,Cantidad,Comentarios,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES("
                            + Obj!.CodDocumento + ","
                            + "N'" + SqlTexto(Obj.CodProducto) + "',"
                            + SqlFecha(Obj.Fecha) + ",'"
                            + SqlTexto(Obj.TipoMovimiento) + "',"
                            + Obj.CodBarco + ","
                            + SqlNullableInt(Obj.CodSuplidor) + ","
                            + SqlNumero(Obj.Cantidad) + ",'"
                            + SqlTexto(Obj.Comentarios) + "',"
                            + Obj.Version + ","
                            + "'" + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE " + TablaMovimiento(Obj!) + " SET "
                            + "CodProducto=N'" + SqlTexto(Obj!.CodProducto) + "',"
                            + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                            + "TipoMovimiento='" + SqlTexto(Obj.TipoMovimiento) + "',"
                            + "CodBarco=" + Obj.CodBarco + ","
                            + "CodSuplidor=" + SqlNullableInt(Obj.CodSuplidor) + ","
                            + "Cantidad=" + SqlNumero(Obj.Cantidad) + ","
                            + "Comentarios='" + SqlTexto(Obj.Comentarios) + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE " + LlaveMovimiento(Obj) + "=" + Obj.CodDocumento;
                case TipoDAL.Eliminar:
                    return "DELETE FROM " + TablaMovimiento(Obj!) + " WHERE " + LlaveMovimiento(Obj) + "=" + Obj.CodDocumento;
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodDocumento],CONCAT(P.[Producto], ' - ', CONVERT(VARCHAR(10), A.[Fecha], 103), ' - ', A.[TipoMovimiento]) AS [Descripcion] "
                        + "FROM dbo.fn_ColoranteMovimientos() A "
                        + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodDocumento] = " + CodKey;
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(TRY_CAST(A.[CodDocumento] as bigint)),0)+1 as 'CodDocumento' FROM dbo.fn_ColoranteMovimientos() A ";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM dbo.fn_ColoranteMovimientosLog() UNION ALL SELECT * FROM dbo.fn_ColoranteMovimientos()) A " +
                        "WHERE A.[CodDocumento]=" + CodKey;
                case TipoDAL.Log:
                    return "SELECT A.[CodDocumento], A.[CodProducto], ISNULL(P.[Producto], '') AS [Producto],"
                      + "ISNULL(TP.[Descripcion], '') AS [TipoProducto], ISNULL(P.[DescripcionCorta], '') AS [DescripcionCorta],"
                      + "A.[Fecha], A.[TipoMovimiento], ISNULL(A.[CodBarco], 0) AS [CodBarco], ISNULL(B.[Barco], '') AS [Barco],"
                      + "ISNULL(A.[CodSuplidor], 0) AS [CodSuplidor], ISNULL(S.[Suplidor], '') AS [Suplidor],"
                      + "A.[Cantidad], A.[Comentarios],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                      + "FROM (SELECT * FROM dbo.fn_ColoranteMovimientosLog() UNION ALL SELECT * FROM dbo.fn_ColoranteMovimientos()) A "
                      + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                      + "LEFT JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                      + "LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] "
                      + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                      + "WHERE A.[CodDocumento] = " + CodKey + " "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodDocumento],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "ISNULL(TP.[Descripcion], '') AS [TipoProducto],ISNULL(P.[DescripcionCorta], '') AS [DescripcionCorta],"
                + "A.[Fecha],A.[TipoMovimiento],ISNULL(A.[CodBarco], 0) AS [CodBarco],ISNULL(B.[Barco], '') AS [Barco],"
                + "ISNULL(A.[CodSuplidor], 0) AS [CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[Cantidad],A.[Comentarios] "
                + "FROM dbo.fn_ColoranteMovimientos() A "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] ";
        }

        private string QueryListado(PaginacionParametros paginacion, string TipoMovimiento = "", string CodProducto = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["CodDocumento"] = "A.[CodDocumento]",
                ["codProducto"] = "A.[CodProducto]",
                ["producto"] = "P.[Producto]",
                ["fecha"] = "A.[Fecha]",
                ["tipoMovimiento"] = "A.[TipoMovimiento]",
                ["codBarco"] = "A.[CodBarco]",
                ["barco"] = "B.[Barco]",
                ["codSuplidor"] = "A.[CodSuplidor]",
                ["suplidor"] = "S.[Suplidor]",
                ["cantidad"] = "A.[Cantidad]",
                ["comentarios"] = "A.[Comentarios]"
            };
            string where = "WHERE 1 = 1 "
                + QueryFiltroTipoMovimiento(TipoMovimiento)
                + (!string.IsNullOrWhiteSpace(CodProducto) ? "AND CONVERT(NVARCHAR(20), A.[CodProducto]) = N'" + SqlTexto(CodProducto) + "' " : "")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodDocumento])",
                    "CONVERT(VARCHAR(20), A.[CodProducto])",
                    "P.[Producto]",
                    "TP.[Descripcion]",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "A.[TipoMovimiento]",
                    "CONVERT(VARCHAR(20), A.[CodBarco])",
                    "B.[Barco]",
                    "CONVERT(VARCHAR(20), A.[CodSuplidor])",
                    "S.[Suplidor]",
                    "CONVERT(VARCHAR(30), A.[Cantidad])",
                    "A.[Comentarios]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodDocumento] DESC");

            return "SELECT A.[CodDocumento],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "ISNULL(TP.[Descripcion], '') AS [TipoProducto],ISNULL(P.[DescripcionCorta], '') AS [DescripcionCorta],"
                + "A.[Fecha],A.[TipoMovimiento],ISNULL(A.[CodBarco], 0) AS [CodBarco],ISNULL(B.[Barco], '') AS [Barco],"
                + "ISNULL(A.[CodSuplidor], 0) AS [CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[Cantidad],A.[Comentarios], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM dbo.fn_ColoranteMovimientos() A "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private static string TablaMovimiento(ColoranteDTO movimiento)
            => string.Equals(movimiento.TipoMovimiento, "INGRESO", StringComparison.OrdinalIgnoreCase) ? "EntradaColorante" : "SalidaColorante";

        private static string LlaveMovimiento(ColoranteDTO movimiento)
            => string.Equals(movimiento.TipoMovimiento, "INGRESO", StringComparison.OrdinalIgnoreCase) ? "CodEntradaColorante" : "CodSalidaColorante";

        private string QueryListarProductosColorante()
        {
            return "SELECT A.[CodProducto],A.[Producto] "
                + "FROM Producto A "
                + "INNER JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE UPPER(TP.[Descripcion]) = UPPER('Colorante') OR UPPER(ISNULL(A.[Tipo], '')) = UPPER('Colorante') "
                + "ORDER BY A.[Producto]";
        }

        private string QueryFiltroTipoMovimiento(string TipoMovimiento)
        {
            string[] tipos = NormalizarTiposMovimiento(TipoMovimiento);

            if (tipos.Length == 0)
                return "";

            bool ajustePositivo = tipos.Contains("AJUSTE_POSITIVO");
            bool ajusteNegativo = tipos.Contains("AJUSTE_NEGATIVO");
            string[] tiposBase = tipos
                .Where(tipo => tipo != "AJUSTE_POSITIVO" && tipo != "AJUSTE_NEGATIVO")
                .ToArray();

            List<string> condiciones = new List<string>();

            if (tiposBase.Length > 0)
            {
                string filtro = string.Join(",", tiposBase.Select(tipo => "'" + SqlTexto(tipo) + "'"));
                condiciones.Add("UPPER(A.[TipoMovimiento]) IN (" + filtro + ")");
            }

            if (ajustePositivo)
                condiciones.Add("(UPPER(A.[TipoMovimiento]) = 'AJUSTE' AND A.[Cantidad] > 0)");

            if (ajusteNegativo)
                condiciones.Add("(UPPER(A.[TipoMovimiento]) = 'AJUSTE' AND A.[Cantidad] < 0)");

            return condiciones.Count == 0 ? "" : "AND (" + string.Join(" OR ", condiciones) + ") ";
        }

        private MsjDB PrepararMovimiento(ColoranteDTO Obj, TipoDAL accion, ColoranteDTO? ObjAnterior = null)
        {
            if (accion != TipoDAL.Eliminar)
            {
                Obj.TipoMovimiento = NormalizarTipoMovimiento(Obj.TipoMovimiento);
                Obj.CodProducto = (Obj.CodProducto ?? "").Trim();

                if (string.IsNullOrWhiteSpace(Obj.CodProducto))
                    return Error("El producto es requerido.");

                if (!Obj.Fecha.HasValue)
                    return Error("La fecha es requerida.");

                if (!MovimientoValido(Obj.TipoMovimiento))
                    return Error("El tipo de movimiento debe ser ingreso, ajuste, salida, inyección en manifold o préstamo.");

                if (!ProductoEsColorante(Obj.CodProducto))
                    return Error("El producto seleccionado debe ser de tipo colorante.");

                if (Obj.TipoMovimiento == MovimientoAjuste)
                {
                    if (Obj.Cantidad == 0)
                        return Error("La cantidad del ajuste debe ser diferente de cero.");
                }
                else if (Obj.Cantidad <= 0)
                {
                    return Error("La cantidad debe ser mayor a cero.");
                }

                if (EsMovimientoSalida(Obj.TipoMovimiento) && Obj.CodBarco > 0 && Obj.CodSuplidor <= 0)
                    return Error("El suplidor es requerido.");

                if (Obj.CodSuplidor > 0 && !SuplidorExiste(Obj.CodSuplidor))
                    return Error("El suplidor seleccionado no existe.");
            }

            if (accion == TipoDAL.Editar && ObjAnterior != null && !string.IsNullOrWhiteSpace(ObjAnterior.CodProducto) && ObjAnterior.CodProducto != Obj.CodProducto)
            {
                MsjDB validacionAnterior = ValidarSecuenciaProducto(ObjAnterior.CodProducto, ObjAnterior, TipoDAL.Eliminar, false);
                if (!validacionAnterior.Estatus)
                    return validacionAnterior;
            }

            string codProducto = accion == TipoDAL.Eliminar
                ? ObjAnterior?.CodProducto ?? Obj.CodProducto
                : Obj.CodProducto;

            return ValidarSecuenciaProducto(codProducto, Obj, accion, accion != TipoDAL.Eliminar);
        }

        private MsjDB ValidarSecuenciaProducto(string CodProducto, ColoranteDTO objetivo, TipoDAL accion, bool asignarObjetivo)
        {
            if (string.IsNullOrWhiteSpace(CodProducto))
                return Ok();

            List<ColoranteDTO> registros = ObjDAL.EjecutarReader(QueryRegistrosProducto(CodProducto), MapColorante);

            if (accion == TipoDAL.Agregar)
            {
                registros.Add(ClonarMovimiento(objetivo));
            }

            if (accion == TipoDAL.Editar)
            {
                bool reemplazado = false;

                for (int i = 0; i < registros.Count; i++)
                {
                    if (registros[i].CodDocumento == objetivo.CodDocumento)
                    {
                        registros[i] = ClonarMovimiento(objetivo);
                        reemplazado = true;
                        break;
                    }
                }

                if (!reemplazado)
                    registros.Add(ClonarMovimiento(objetivo));
            }

            if (accion == TipoDAL.Eliminar)
            {
                registros = registros
                    .Where(registro => registro.CodDocumento != objetivo.CodDocumento)
                    .ToList();
            }

            registros = registros
                .OrderBy(registro => registro.Fecha ?? DateTime.MinValue)
                .ThenBy(registro => registro.CodDocumento)
                .ToList();

            decimal saldo = 0m;

            foreach (ColoranteDTO registro in registros)
            {
                registro.TipoMovimiento = NormalizarTipoMovimiento(registro.TipoMovimiento);

                if (registro.TipoMovimiento == MovimientoAjuste)
                {
                    saldo += registro.Cantidad;

                    if (saldo < 0)
                        return Error("El ajuste deja existencia negativa para el producto colorante.");
                }
                else if (EsMovimientoIngreso(registro.TipoMovimiento))
                {
                    saldo += registro.Cantidad;
                }
                else if (EsMovimientoSalida(registro.TipoMovimiento))
                {
                    decimal nuevoSaldo = saldo - registro.Cantidad;

                    if (nuevoSaldo < 0)
                        return Error("La salida deja existencia negativa para el producto colorante.");

                    saldo = nuevoSaldo;
                }
                else
                {
                    return Error("El tipo de movimiento debe ser ingreso, ajuste, salida, inyección en manifold o préstamo.");
                }

                if (asignarObjetivo && registro.CodDocumento == objetivo.CodDocumento)
                {
                    // Se mantiene para compatibilidad futura: los saldos no se persisten en la tabla.
                }
            }

            return Ok();
        }

        private void RecalcularProducto(string CodProducto)
        {
            // No-op: los saldos no se almacenan en columnas de Colorante.
        }

        private bool ProductoEsColorante(string CodProducto)
        {
            return ObjDAL.EjecutarExiste(QueryProductoColorante(CodProducto));
        }

        private bool SuplidorExiste(int CodSuplidor)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Suplidor A WHERE A.[CodSuplidor] = " + CodSuplidor);
        }

        private string QueryProductoColorante(string CodProducto)
        {
            return "SELECT 1 "
                + "FROM Producto P "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE CONVERT(NVARCHAR(20), P.[CodProducto]) = N'" + SqlTexto(CodProducto) + "' "
                + "AND (UPPER(TP.[Descripcion]) = UPPER('Colorante') OR UPPER(ISNULL(P.[Tipo], '')) = UPPER('Colorante'))";
        }

        private string QueryRegistrosProducto(string CodProducto)
        {
            return SelectBase()
                + "WHERE CONVERT(NVARCHAR(20), A.[CodProducto]) = N'" + SqlTexto(CodProducto) + "' "
                + "ORDER BY A.[Fecha] ASC, A.[CodDocumento] ASC";
        }

        private ColoranteDTO MapColorante(SqlDataReader reader)
        {
            ColoranteDTO Obj = new ColoranteDTO();
            Obj.CodDocumento = Entero(reader["CodDocumento"]);
            Obj.IdColorante = ObjEncriptacion.Encriptar(Obj.CodDocumento.ToString());
            Obj.CodProducto = reader["CodProducto"].ToString() ?? "";
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto);
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.TipoProducto = reader["TipoProducto"].ToString() ?? "";
            Obj.DescripcionCorta = reader["DescripcionCorta"].ToString() ?? "";
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.TipoMovimiento = reader["TipoMovimiento"].ToString() ?? "";
            Obj.CodBarco = Entero(reader["CodBarco"]);
            Obj.Barco = reader["Barco"].ToString() ?? "";

            if (Obj.CodBarco > 0)
                Obj.IdBarco = ObjEncriptacion.Encriptar(Obj.CodBarco.ToString());

            Obj.CodSuplidor = Entero(reader["CodSuplidor"]);
            Obj.Suplidor = reader["Suplidor"].ToString() ?? "";

            if (Obj.CodSuplidor > 0)
                Obj.IdSuplidor = ObjEncriptacion.Encriptar(Obj.CodSuplidor.ToString());

            Obj.Cantidad = Convert.ToDecimal(reader["Cantidad"]);
            Obj.Comentarios = reader["Comentarios"].ToString() ?? "";
            return Obj;
        }

        private ColoranteDTO MapColoranteLog(SqlDataReader reader)
        {
            ColoranteDTO Obj = MapColorante(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion ?? "");

            Obj.FechaCreacion = Fecha(reader["FechaCreacion"]);
            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion ?? "");

            Obj.FechaActualizacion = Fecha(reader["FechaActualizacion"]);
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private ColoranteDTO ClonarMovimiento(ColoranteDTO movimiento)
        {
            return new ColoranteDTO
            {
                IdColorante = movimiento.IdColorante,
                CodDocumento = movimiento.CodDocumento,
                CodProducto = movimiento.CodProducto,
                IdProducto = movimiento.IdProducto,
                Producto = movimiento.Producto,
                TipoProducto = movimiento.TipoProducto,
                DescripcionCorta = movimiento.DescripcionCorta,
                Fecha = movimiento.Fecha,
                TipoMovimiento = movimiento.TipoMovimiento,
                CodBarco = movimiento.CodBarco,
                IdBarco = movimiento.IdBarco,
                Barco = movimiento.Barco,
                CodSuplidor = movimiento.CodSuplidor,
                IdSuplidor = movimiento.IdSuplidor,
                Suplidor = movimiento.Suplidor,
                Cantidad = movimiento.Cantidad,
                Comentarios = movimiento.Comentarios
            };
        }

        private string NormalizarTipoMovimiento(string? valor)
        {
            return (valor ?? "").Trim().ToUpperInvariant();
        }

        private bool MovimientoValido(string valor)
        {
            return MovimientosIngreso.Contains(valor) || MovimientosSalida.Contains(valor);
        }

        private string[] NormalizarTiposMovimiento(string? valor)
        {
            return (valor ?? "")
                .Split(',')
                .Select(tipo => NormalizarTipoMovimiento(tipo))
                .Where(tipo => !string.IsNullOrWhiteSpace(tipo))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        private bool EsMovimientoIngreso(string valor)
        {
            return MovimientosIngreso.Contains(valor);
        }

        private bool EsMovimientoSalida(string valor)
        {
            return MovimientosSalida.Contains(valor);
        }

        private DateTime? Fecha(object valor)
        {
            if (valor != DBNull.Value && DateTime.TryParse(valor.ToString(), out DateTime fecha))
                return fecha;

            return null;
        }

        private int Entero(object valor)
        {
            if (valor != DBNull.Value && int.TryParse(valor.ToString(), out int numero))
                return numero;

            return 0;
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

        private string SqlNullableInt(int valor)
        {
            return valor > 0 ? valor.ToString(CultureInfo.InvariantCulture) : "NULL";
        }
    }
}






