using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace app.Models.Aditivo
{
    /// <summary>
    /// DAO para el mantenimiento de movimientos de aditivo.
    /// </summary>
    internal class AditivoDAO
    {
        private const string MovimientoIngreso = "INGRESO";
        private const string MovimientoSalida = "SALIDA";

        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<AditivoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "", string TipoMovimiento = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<AditivoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, TipoMovimiento), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapAditivo(reader);
            });

            return new PaginacionResultado<AditivoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodDocumento"].ToString()
            });
        }

        internal List<SelectListItem> ListarProductosAditivo()
        {
            return ObjDAL.EjecutarReader(QueryListarProductosAditivo(), reader => new SelectListItem()
            {
                Text = reader["Producto"].ToString(),
                Value = reader["CodProducto"].ToString()
            });
        }

        internal AditivoDTO Obtener(int CodDocumento)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodDocumento), MapAditivo).FirstOrDefault() ?? new AditivoDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(AditivoDTO Obj)
        {
            Obj.CodDocumento = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararMovimiento(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Aditivo", "CREADO", "CodDocumento:" + Obj.CodDocumento, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(AditivoDTO Obj)
        {
            AditivoDTO ObjAnterior = Obtener(Obj.CodDocumento);

            if (ObjAnterior.CodDocumento <= 0)
                return Error("Movimiento de aditivo no encontrado.");

            Obj.Version = ObtenerVersion(Obj.CodDocumento);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararMovimiento(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Aditivo", "EDITADO", "CodDocumento:" + Obj.CodDocumento, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(AditivoDTO Obj)
        {
            AditivoDTO ObjAnterior = Obtener(Obj.CodDocumento);

            if (ObjAnterior.CodDocumento <= 0)
                return Error("Movimiento de aditivo no encontrado.");

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: ObjAnterior), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Aditivo", "ELIMINADO", "CodDocumento:" + ObjAnterior.CodDocumento, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal int ObtenerVersion(int CodDocumento)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodDocumento), 1);
        }

        internal List<AditivoDTO> Log(int CodDocumento)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodDocumento), MapAditivoLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, AditivoDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO " + TablaMovimiento(Obj!) + " (" + LlaveMovimiento(Obj!) + ",CodSuplidor,CodProducto,CodTanque,Fecha,TipoMovimiento,Cantidad,Comentario,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj!.CodDocumento + "',"
                            + SqlNullableInt(Obj.CodSuplidor) + ","
                            + SqlNullableInt(Obj.CodProducto) + ","
                            + SqlNullableTexto(Obj.CodTanque) + ","
                            + SqlFecha(Obj.Fecha) + ",'"
                            + SqlTexto(Obj.TipoMovimiento) + "',"
                            + SqlNumero(Obj.Cantidad) + ",N'"
                            + SqlTexto(Obj.Comentario) + "','"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE " + TablaMovimiento(Obj!) + " SET "
                            + "CodSuplidor=" + SqlNullableInt(Obj!.CodSuplidor) + ","
                            + "CodProducto=" + SqlNullableInt(Obj.CodProducto) + ","
                            + "CodTanque=" + SqlNullableTexto(Obj.CodTanque) + ","
                            + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                            + "TipoMovimiento='" + SqlTexto(Obj.TipoMovimiento) + "',"
                            + "Cantidad=" + SqlNumero(Obj.Cantidad) + ","
                            + "Comentario=N'" + SqlTexto(Obj.Comentario) + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE " + LlaveMovimiento(Obj) + "='" + Obj.CodDocumento + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM " + TablaMovimiento(Obj!) + " WHERE " + LlaveMovimiento(Obj) + "='" + Obj.CodDocumento + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodDocumento],CONCAT(ISNULL(P.[Producto], ''), ' - ', CONVERT(VARCHAR(10), A.[Fecha], 103), ' - ', A.[TipoMovimiento]) AS [Descripcion] "
                        + "FROM dbo.fn_AditivoMovimientos() A "
                        + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodDocumento]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodDocumento]),0)+1 as 'CodDocumento' FROM dbo.fn_AditivoMovimientos() A ";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM ("
                        + SelectUnionLog("dbo.fn_AditivoMovimientosLog()")
                        + " UNION ALL "
                        + SelectUnionLog("dbo.fn_AditivoMovimientos()")
                        + ") A "
                        + "WHERE A.[CodDocumento]='" + CodKey + "'";
                case TipoDAL.Log:
                    return SelectLogBase() + "WHERE A.[CodDocumento] = '" + CodKey + "' ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodDocumento],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[Fecha],A.[TipoMovimiento],A.[Cantidad],A.[Comentario] "
                + "FROM dbo.fn_AditivoMovimientos() A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] ";
        }

        private string SelectLogBase()
        {
            return "SELECT A.[CodDocumento],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[Fecha],A.[TipoMovimiento],A.[Cantidad],A.[Comentario],"
                + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                + "FROM (" + SelectUnionLog("dbo.fn_AditivoMovimientosLog()") + " UNION ALL " + SelectUnionLog("dbo.fn_AditivoMovimientos()") + ") A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] ";
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodDocumento],[CodSuplidor],[CodProducto],[CodTanque],[Fecha],[TipoMovimiento],[Cantidad],[Comentario],"
                + "[Version],[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog],[Estatus] "
                + "FROM " + tabla;
        }

        private string QueryListado(PaginacionParametros paginacion, string TipoMovimiento = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["CodDocumento"] = "A.[CodDocumento]",
                ["suplidor"] = "S.[Suplidor]",
                ["producto"] = "P.[Producto]",
                ["tanque"] = "T.[Tanque]",
                ["fecha"] = "A.[Fecha]",
                ["tipoMovimiento"] = "A.[TipoMovimiento]",
                ["cantidad"] = "A.[Cantidad]",
                ["comentario"] = "A.[Comentario]"
            };
            string where = "WHERE 1 = 1 "
                + QueryFiltroTipoMovimiento(TipoMovimiento)
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodDocumento])",
                    "S.[Suplidor]",
                    "P.[Producto]",
                    "T.[Tanque]",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "A.[TipoMovimiento]",
                    "CONVERT(VARCHAR(30), A.[Cantidad])",
                    "A.[Comentario]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodDocumento] DESC");

            return "SELECT A.[CodDocumento],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[Fecha],A.[TipoMovimiento],A.[Cantidad],A.[Comentario], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM dbo.fn_AditivoMovimientos() A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private static string TablaMovimiento(AditivoDTO movimiento)
            => string.Equals(movimiento.TipoMovimiento, "SALIDA", StringComparison.OrdinalIgnoreCase) ? "SalidaAditivo" : "EntradaAditivo";

        private static string LlaveMovimiento(AditivoDTO movimiento)
            => string.Equals(movimiento.TipoMovimiento, "SALIDA", StringComparison.OrdinalIgnoreCase) ? "CodSalidaAditivo" : "CodEntradaAditivo";

        private string QueryListarProductosAditivo()
        {
            return "SELECT A.[CodProducto],A.[Producto] "
                + "FROM Producto A "
                + "INNER JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE UPPER(TP.[Descripcion]) = UPPER('Aditivo') "
                + "ORDER BY A.[Producto]";
        }

        private string QueryFiltroTipoMovimiento(string TipoMovimiento)
        {
            string valor = NormalizarTipoMovimiento(TipoMovimiento);

            if (string.IsNullOrWhiteSpace(valor))
                return "";

            return "AND UPPER(A.[TipoMovimiento]) = UPPER('" + SqlTexto(valor) + "') ";
        }

        private MsjDB PrepararMovimiento(AditivoDTO Obj)
        {
            Obj.TipoMovimiento = NormalizarTipoMovimiento(Obj.TipoMovimiento);
            Obj.Comentario = (Obj.Comentario ?? "").Trim();

            if (Obj.CodDocumento <= 0)
                return Error("El numero de transaccion es requerido.");

            if (Obj.Comentario.Length > 250)
                return Error("El comentario debe tener maximo 250 caracteres.");

            if (Obj.Cantidad <= 0)
                return Error("La cantidad debe ser mayor a cero.");

            if (Obj.TipoMovimiento != MovimientoIngreso && Obj.TipoMovimiento != MovimientoSalida)
                return Error("El tipo de movimiento debe ser ingreso o salida.");

            if (Obj.TipoMovimiento == MovimientoSalida)
            {
                Obj.Fecha ??= DateTime.Now;
                if (Obj.CodProducto <= 0)
                    return Error("El producto es requerido.");

                if (string.IsNullOrWhiteSpace(Obj.CodTanque))
                    return Error("El tanque es requerido.");

                if (!ProductoEsAditivo(Obj.CodProducto))
                    return Error("El producto seleccionado debe ser de tipo aditivo.");

                if (!TanqueEsAditivo(Obj.CodTanque))
                    return Error("El tanque seleccionado debe ser de un producto tipo aditivo.");

                return Ok();
            }

            if (!Obj.Fecha.HasValue)
                return Error("La fecha es requerida.");

            if (Obj.CodSuplidor <= 0)
                return Error("El suplidor es requerido.");

            if (Obj.CodProducto <= 0)
                return Error("El producto es requerido.");

            if (string.IsNullOrWhiteSpace(Obj.CodTanque))
                return Error("El tanque es requerido.");

            if (!ProductoEsAditivo(Obj.CodProducto))
                return Error("El producto seleccionado debe ser de tipo aditivo.");

            if (!TanqueEsAditivo(Obj.CodTanque))
                return Error("El tanque seleccionado debe ser de un producto tipo aditivo.");

            return Ok();
        }

        private bool ProductoEsAditivo(int CodProducto)
        {
            return ObjDAL.EjecutarExiste(QueryProductoAditivo(CodProducto));
        }

        private bool TanqueEsAditivo(string CodTanque)
        {
            return ObjDAL.EjecutarExiste(QueryTanqueAditivo(CodTanque));
        }

        private string QueryProductoAditivo(int CodProducto)
        {
            return "SELECT 1 "
                + "FROM Producto P "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE P.[CodProducto] = '" + CodProducto + "' "
                + "AND UPPER(TP.[Descripcion]) = UPPER('Aditivo')";
        }

        private string QueryTanqueAditivo(string CodTanque)
        {
            return "SELECT 1 "
                + "FROM Tanque T "
                + "INNER JOIN Producto P ON T.[CodProducto] = P.[CodProducto] "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE T.[CodTanque] = N'" + SqlTexto(CodTanque) + "' "
                + "AND UPPER(TP.[Descripcion]) = UPPER('Aditivo')";
        }

        private AditivoDTO MapAditivo(SqlDataReader reader)
        {
            AditivoDTO Obj = new AditivoDTO();
            Obj.CodDocumento = Int(reader["CodDocumento"]);
            Obj.IdAditivo = ObjEncriptacion.Encriptar(Obj.CodDocumento.ToString());
            Obj.CodSuplidor = Int(reader["CodSuplidor"]);
            Obj.IdSuplidor = Obj.CodSuplidor > 0 ? ObjEncriptacion.Encriptar(Obj.CodSuplidor.ToString()) : null;
            Obj.Suplidor = reader["Suplidor"].ToString() ?? "";
            Obj.CodProducto = Int(reader["CodProducto"]);
            Obj.IdProducto = Obj.CodProducto > 0 ? ObjEncriptacion.Encriptar(Obj.CodProducto.ToString()) : null;
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CodTanque = reader["CodTanque"].ToString() ?? "";
            Obj.IdTanque = !string.IsNullOrWhiteSpace(Obj.CodTanque) ? ObjEncriptacion.Encriptar(Obj.CodTanque) : null;
            Obj.Tanque = reader["Tanque"].ToString() ?? "";
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.TipoMovimiento = reader["TipoMovimiento"].ToString() ?? "";
            Obj.Cantidad = Convert.ToDecimal(reader["Cantidad"]);
            Obj.Comentario = reader["Comentario"].ToString() ?? "";
            return Obj;
        }

        private AditivoDTO MapAditivoLog(SqlDataReader reader)
        {
            AditivoDTO Obj = MapAditivo(reader);
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

        private int Int(object valor)
        {
            if (valor == DBNull.Value)
                return 0;

            return Convert.ToInt32(valor);
        }

        private DateTime? Fecha(object valor)
        {
            if (valor != DBNull.Value && DateTime.TryParse(valor.ToString(), out DateTime fecha))
                return fecha;

            return null;
        }

        private MsjDB Ok()
        {
            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }

        private MsjDB Error(string mensaje)
        {
            return new MsjDB { Estatus = false, Msj = mensaje, Key = 0 };
        }

        private string NormalizarTipoMovimiento(string? valor)
        {
            return (valor ?? "").Trim().ToUpperInvariant();
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
            return valor > 0 ? "'" + valor + "'" : "NULL";
        }

        private string SqlNullableTexto(string? valor)
        {
            string texto = (valor ?? "").Trim();
            return string.IsNullOrWhiteSpace(texto) ? "NULL" : "N'" + SqlTexto(texto) + "'";
        }
    }
}





