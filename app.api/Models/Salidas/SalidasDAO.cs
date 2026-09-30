using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Globalization;
using System.Text;

namespace app.Models.Salidas
{
    /// <summary>
    /// DAO para el mantenimiento de salidas de producto.
    /// </summary>
    internal class SalidasDAO
    {
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<SalidasDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<SalidasDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapSalida(reader);
            });

            return new PaginacionResultado<SalidasDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal PaginacionResultado<SalidasDTO> ListadoAjustes(int page = 1, int pageSize = 50, string search = "", string sort = "")
            => ListadoTabla("AjusteSalidaCombustible", "CodAjusteSalidaCombustible", page, pageSize, search, sort);

        internal PaginacionResultado<SalidasDTO> ListadoUnidad(int page = 1, int pageSize = 50, string search = "", string sort = "")
            => ListadoTabla("UnidadSalidaCombustible", "CodUnidadSalidaCombustible", page, pageSize, search, sort);

        private PaginacionResultado<SalidasDTO> ListadoTabla(string tabla, string llave, int page, int pageSize, string search, string sort)
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<SalidasDTO> items = ObjDAL.EjecutarReader(QueryListadoTabla(tabla, llave, paginacion), reader =>
            {
                if (totalCount == 0) totalCount = PaginacionSql.LeerTotal(reader);
                return MapSalida(reader);
            });
            return new PaginacionResultado<SalidasDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal SalidasDTO Obtener(int CodSalida)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodSalida), MapSalida).FirstOrDefault() ?? new SalidasDTO();
        }

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

        internal MsjDB Agregar(SalidasDTO Obj)
        {
            Obj.CodSalida = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararSalida(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Salidas", "CREADO", "CodSalida:" + Obj.CodSalida, Nuevo: Obj);
                AutorizacionDocumentos.RegistrarPendiente((int)Menus.Salida, Obj.CodSalida);
            }

            return msjDB;
        }

        internal MsjDB AgregarAjuste(SalidasDTO Obj)
        {
            MsjDB validacion = PrepararSalida(Obj); if (!validacion.Estatus) return validacion;
            int codigo = ObjDAL.EjecutarScalar("SELECT ISNULL(MAX(CodAjusteSalidaCombustible),0)+1 FROM AjusteSalidaCombustible", 1);
            string usuario = SqlTexto(new VerificarUsuario().SesionUsuario());
            string sql = "INSERT INTO AjusteSalidaCombustible (CodAjusteSalidaCombustible,Fecha,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente,SiglasUnidad,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES (" + codigo + "," + SqlFecha(Obj.Fecha) + "," + Obj.CodSuplidor + "," + Obj.CodProducto + "," + SqlNumero(Obj.CantidadEstandar) + "," + SqlNumero(Obj.CantidadAmbiente) + ",N'" + SqlTexto(Obj.SiglasUnidad.Trim()) + "',1,1,N'" + usuario + "',GETDATE(),'C')";
            MsjDB respuesta = ObjDAL.Ejecutar(sql, Key: false, tipoDAL: TipoDAL.Agregar);
            if (respuesta.Estatus) AutorizacionDocumentos.RegistrarPendiente((int)Menus.AjusteSalidaProducto, codigo);
            return respuesta;
        }

        internal MsjDB AgregarUnidad(SalidasDTO Obj)
        {
            if (string.IsNullOrWhiteSpace(Obj.SiglasUnidad)) return Error("Las siglas de la unidad son requeridas.");
            MsjDB validacion = PrepararSalida(Obj); if (!validacion.Estatus) return validacion;
            int codigo = ObjDAL.EjecutarScalar("SELECT ISNULL(MAX(CodUnidadSalidaCombustible),0)+1 FROM UnidadSalidaCombustible", 1);
            string sql = "INSERT INTO UnidadSalidaCombustible (CodUnidadSalidaCombustible,Fecha,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente,SiglasUnidad,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES (" + codigo + "," + SqlFecha(Obj.Fecha) + "," + Obj.CodSuplidor + "," + Obj.CodProducto + "," + SqlNumero(Obj.CantidadEstandar) + "," + SqlNumero(Obj.CantidadAmbiente) + ",N'" + SqlTexto(Obj.SiglasUnidad.Trim()) + "',1,1,N'" + SqlTexto(new VerificarUsuario().SesionUsuario()) + "',GETDATE(),'C')";
            MsjDB respuesta = ObjDAL.Ejecutar(sql, Key: false, tipoDAL: TipoDAL.Agregar);
            if (respuesta.Estatus) AutorizacionDocumentos.RegistrarPendiente((int)Menus.SalidaUnidad, codigo);
            return respuesta;
        }

        internal MsjDB Editar(SalidasDTO Obj)
        {
            SalidasDTO ObjAnterior = Obtener(Obj.CodSalida);
            if (ObjAnterior.CodSalida <= 0)
                return Error("Salida de producto no encontrada.");

            Obj.Version = ObtenerVersion(Obj.CodSalida);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararSalida(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Salidas", "EDITADO", "CodSalida:" + Obj.CodSalida, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Eliminar(SalidasDTO Obj)
        {
            SalidasDTO ObjAnterior = Obtener(Obj.CodSalida);
            if (ObjAnterior.CodSalida <= 0)
                return Error("Salida de producto no encontrada.");

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Salidas", "ELIMINADO", "CodSalida:" + Obj.CodSalida, Anterior: ObjAnterior);
            }

            return msjDB;
        }

        internal int ObtenerVersion(int CodSalida)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodSalida), 1);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, SalidasDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return QueryAgregar(Obj!);
                case TipoDAL.Editar:
                    return QueryEditar(Obj!);
                case TipoDAL.Eliminar:
                    return "DELETE FROM SalidasCombustible WHERE CodSalidasCombustible='" + Obj!.CodSalida + "'";
                case TipoDAL.Listado:
                    return SelectBase();
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodSalidasCombustible]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodSalidasCombustible]),0)+1 as 'CodSalida' FROM SalidasCombustible A";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' "
                        + "FROM (SELECT [CodSalidasCombustible] AS [CodSalida],[Version] FROM SalidasCombustible_LOG UNION ALL SELECT [CodSalidasCombustible] AS [CodSalida],[Version] FROM SalidasCombustible) A "
                        + "WHERE A.[CodSalida]='" + CodKey + "'";
                default:
                    return "";
            }
        }

        private MsjDB PrepararSalida(SalidasDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return Error("La fecha es requerida.");

            if (Obj.CodSuplidor <= 0)
                return Error("El suplidor es requerido.");

            if (Obj.CodProducto <= 0)
                return Error("El producto es requerido.");

            if (Obj.CantidadEstandar <= 0)
                return Error("La cantidad estandar debe ser mayor a cero.");

            if (Obj.CantidadAmbiente <= 0)
                return Error("La cantidad ambiente debe ser mayor a cero.");

            if (!SocioExiste(Obj.CodSuplidor))
                return Error("El suplidor seleccionado no existe.");

            if (!ProductoEsCombustible(Obj.CodProducto))
                return Error("El producto seleccionado debe ser de tipo combustible.");

            Obj.Fecha = Obj.Fecha.Value.Date;

            return Ok();
        }

        private string SelectBase()
        {
            return "SELECT A.[CodSalidasCombustible] AS [CodSalida],A.[Fecha],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CantidadEstandar],A.[CantidadAmbiente],A.[SiglasUnidad] "
                + "FROM SalidasCombustible A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codSalida"] = "A.[CodSalidasCombustible]",
                ["fecha"] = "A.[Fecha]",
                ["suplidor"] = "S.[Suplidor]",
                ["producto"] = "P.[Producto]",
                ["siglasUnidad"] = "A.[SiglasUnidad]",
                ["cantidadEstandar"] = "A.[CantidadEstandar]",
                ["cantidadAmbiente"] = "A.[CantidadAmbiente]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodSalidasCombustible])",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "S.[Suplidor]",
                    "P.[Producto]",
                    "A.[SiglasUnidad]",
                    "CONVERT(VARCHAR(30), A.[CantidadEstandar])",
                    "CONVERT(VARCHAR(30), A.[CantidadAmbiente])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodSalidasCombustible] DESC");

            return "SELECT A.[CodSalidasCombustible] AS [CodSalida],A.[Fecha],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CantidadEstandar],A.[CantidadAmbiente],A.[SiglasUnidad], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM SalidasCombustible A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryListadoTabla(string tabla, string llave, PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codigo"] = "A.[" + llave + "]",
                ["fecha"] = "A.[Fecha]",
                ["suplidor"] = "S.[Suplidor]",
                ["producto"] = "P.[Producto]",
                ["siglasUnidad"] = "A.[SiglasUnidad]",
                ["cantidadEstandar"] = "A.[CantidadEstandar]",
                ["cantidadAmbiente"] = "A.[CantidadAmbiente]"
            };
            string where = "WHERE A.[Estatus]=1 " + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
            {
                "CONVERT(VARCHAR(20), A.[" + llave + "])", "CONVERT(VARCHAR(10), A.[Fecha], 103)", "S.[Suplidor]", "P.[Producto]", "A.[SiglasUnidad]",
                "CONVERT(VARCHAR(30), A.[CantidadEstandar])", "CONVERT(VARCHAR(30), A.[CantidadAmbiente])"
            });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[" + llave + "] DESC");
            return "SELECT A.[" + llave + "] AS [CodSalida],A.[Fecha],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],A.[CantidadEstandar],A.[CantidadAmbiente],A.[SiglasUnidad],ISNULL(A.[Estatus],1) AS [Estatus],"
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] FROM " + tabla + " A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor]=S.[CodSuplidor] LEFT JOIN Producto P ON A.[CodProducto]=P.[CodProducto] "
                + where + "ORDER BY " + orderBy + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryAgregar(SalidasDTO Obj)
        {
            StringBuilder query = new StringBuilder();
            query.Append("INSERT INTO SalidasCombustible (CodSalidasCombustible,Fecha,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente,SiglasUnidad,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES(");
            query.Append(Obj.CodSalida).Append(",");
            query.Append(SqlFecha(Obj.Fecha)).Append(",");
            query.Append(Obj.CodSuplidor).Append(",");
            query.Append(Obj.CodProducto).Append(",");
            query.Append(SqlNumero(Obj.CantidadEstandar)).Append(",");
            query.Append(SqlNumero(Obj.CantidadAmbiente)).Append(",");
            query.Append("N'").Append(SqlTexto(Obj.SiglasUnidad.Trim())).Append("',");
            query.Append(Obj.Version).Append(",'");
            query.Append(SqlTexto(Obj.CodUsuarioCreacion)).Append("',GETDATE(),'C')");
            return query.ToString();
        }

        private string QueryEditar(SalidasDTO Obj)
        {
            return "UPDATE SalidasCombustible SET "
                + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                + "CodSuplidor=" + Obj.CodSuplidor + ","
                + "CodProducto=" + Obj.CodProducto + ","
                + "CantidadEstandar=" + SqlNumero(Obj.CantidadEstandar) + ","
                + "CantidadAmbiente=" + SqlNumero(Obj.CantidadAmbiente) + ","
                + "SiglasUnidad=N'" + SqlTexto(Obj.SiglasUnidad.Trim()) + "',"
                + "Version=" + Obj.Version + ","
                + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                + "FechaActualizacion=GETDATE() "
                + "WHERE CodSalidasCombustible=" + Obj.CodSalida;
        }

        private SalidasDTO MapSalida(SqlDataReader reader)
        {
            SalidasDTO Obj = new SalidasDTO();
            Obj.CodSalida = Convert.ToInt32(reader["CodSalida"]);
            Obj.IdSalida = ObjEncriptacion.Encriptar(Obj.CodSalida.ToString());
            Obj.Fecha = reader["Fecha"] == DBNull.Value ? null : Convert.ToDateTime(reader["Fecha"]);
            Obj.CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]);
            Obj.IdSuplidor = ObjEncriptacion.Encriptar(Obj.CodSuplidor.ToString());
            Obj.Suplidor = reader["Suplidor"].ToString() ?? "";
            Obj.CodProducto = Convert.ToInt32(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]);
            Obj.CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"]);
            Obj.SiglasUnidad = reader["SiglasUnidad"].ToString() ?? "";
            Obj.Estatus = true;
            return Obj;
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
