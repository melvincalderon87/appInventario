using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.EntradasProducto
{
    /// <summary>Acceso a datos del modulo EntradasProducto.</summary>
    internal class EntradasProductoDAO
    {
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<EntradasProductoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<EntradasProductoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0) totalCount = PaginacionSql.LeerTotal(reader);
                return MapEntradaProducto(reader);
            });
            return new PaginacionResultado<EntradasProductoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal PaginacionResultado<EntradasProductoDTO> ListadoAjustes(int page = 1, int pageSize = 50, string search = "", string sort = "")
            => ListadoTabla("AjusteEntradaCombustible", "CodAjusteEntradaCombustible", page, pageSize, search, sort);

        internal PaginacionResultado<EntradasProductoDTO> ListadoUnidad(int page = 1, int pageSize = 50, string search = "", string sort = "")
            => ListadoTabla("UnidadEntradaCombustible", "CodUnidadEntradaCombustible", page, pageSize, search, sort);

        private PaginacionResultado<EntradasProductoDTO> ListadoTabla(string tabla, string llave, int page, int pageSize, string search, string sort)
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<EntradasProductoDTO> items = ObjDAL.EjecutarReader(QueryListadoTabla(tabla, llave, paginacion), reader =>
            {
                if (totalCount == 0) totalCount = PaginacionSql.LeerTotal(reader);
                return MapEntradaProducto(reader);
            });
            return new PaginacionResultado<EntradasProductoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal int ObtenerKey() => ObjDAL.EjecutarScalar("SELECT ISNULL(MAX(CodEntradasCombustible),0)+1 FROM EntradasCombustible", 1);

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

        internal MsjDB Agregar(EntradasProductoDTO entrada)
        {
            if (!entrada.Fecha.HasValue || entrada.CodSuplidor <= 0 || entrada.CodProducto <= 0 || entrada.CantidadEstandar < 0 || entrada.CantidadAmbiente < 0)
                return new MsjDB { Estatus = false, Msj = "Los datos de la entrada no son validos." };

            if (!EsProductoCombustible(entrada.CodProducto))
                return new MsjDB { Estatus = false, Msj = "El producto seleccionado debe ser de tipo combustible." };

            entrada.CodEntradaProducto = ObtenerKey();
            entrada.Version = 1;
            entrada.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            string fecha = entrada.Fecha.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
            string query = "INSERT INTO EntradasCombustible (CodEntradasCombustible,Fecha,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente,SiglasUnidad,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES ("
                + entrada.CodEntradaProducto + ",'" + fecha + "','" + entrada.CodSuplidor + "','" + entrada.CodProducto + "',"
                + entrada.CantidadEstandar.ToString(CultureInfo.InvariantCulture) + "," + entrada.CantidadAmbiente.ToString(CultureInfo.InvariantCulture) + ",'" + entrada.SiglasUnidad.Trim().Replace("'", "''") + "'"
                + ",1,'" + (entrada.CodUsuarioCreacion ?? "").Replace("'", "''") + "',GETDATE(),'C')";
            MsjDB respuesta = ObjDAL.Ejecutar(query, Key: false, tipoDAL: TipoDAL.Agregar);
            if (respuesta.Estatus) AutorizacionDocumentos.RegistrarPendiente((int)Menus.EntradasProducto, entrada.CodEntradaProducto);
            return respuesta;
        }

        internal MsjDB AgregarAjuste(EntradasProductoDTO entrada)
        {
            if (!entrada.Fecha.HasValue || entrada.CodSuplidor <= 0 || entrada.CodProducto <= 0 || entrada.CantidadEstandar < 0 || entrada.CantidadAmbiente < 0 || !EsProductoCombustible(entrada.CodProducto)) return new MsjDB { Estatus = false, Msj = "Los datos del ajuste de entrada no son válidos." };
            int codigo = ObjDAL.EjecutarScalar("SELECT ISNULL(MAX(CodAjusteEntradaCombustible),0)+1 FROM AjusteEntradaCombustible", 1);
            string usuario = (new VerificarUsuario().SesionUsuario() ?? "").Replace("'", "''");
            string sql = "INSERT INTO AjusteEntradaCombustible (CodAjusteEntradaCombustible,Fecha,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente,SiglasUnidad,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES (" + codigo + ", '" + entrada.Fecha.Value.ToString("yyyy-MM-dd") + "'," + entrada.CodSuplidor + "," + entrada.CodProducto + "," + entrada.CantidadEstandar.ToString(CultureInfo.InvariantCulture) + "," + entrada.CantidadAmbiente.ToString(CultureInfo.InvariantCulture) + ",N'" + entrada.SiglasUnidad.Trim().Replace("'", "''") + "',1,1,N'" + usuario + "',GETDATE(),'C')";
            MsjDB respuesta = ObjDAL.Ejecutar(sql, Key: false, tipoDAL: TipoDAL.Agregar);
            if (respuesta.Estatus) AutorizacionDocumentos.RegistrarPendiente((int)Menus.AjusteEntradaProducto, codigo);
            return respuesta;
        }

        internal MsjDB AgregarUnidad(EntradasProductoDTO entrada)
        {
            if (!entrada.Fecha.HasValue || entrada.CodSuplidor <= 0 || entrada.CodProducto <= 0 || string.IsNullOrWhiteSpace(entrada.SiglasUnidad) || entrada.CantidadEstandar < 0 || entrada.CantidadAmbiente < 0 || !EsProductoCombustible(entrada.CodProducto)) return new MsjDB { Estatus = false, Msj = "Los datos de la entrada por unidad no son válidos." };
            int codigo = ObjDAL.EjecutarScalar("SELECT ISNULL(MAX(CodUnidadEntradaCombustible),0)+1 FROM UnidadEntradaCombustible", 1); string usuario = (new VerificarUsuario().SesionUsuario() ?? "").Replace("'", "''");
            MsjDB respuesta = ObjDAL.Ejecutar("INSERT INTO UnidadEntradaCombustible (CodUnidadEntradaCombustible,Fecha,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente,SiglasUnidad,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES (" + codigo + ",'" + entrada.Fecha.Value.ToString("yyyy-MM-dd") + "'," + entrada.CodSuplidor + "," + entrada.CodProducto + "," + entrada.CantidadEstandar.ToString(CultureInfo.InvariantCulture) + "," + entrada.CantidadAmbiente.ToString(CultureInfo.InvariantCulture) + ",N'" + entrada.SiglasUnidad.Trim().Replace("'", "''") + "',1,1,N'" + usuario + "',GETDATE(),'C')", Key: false, tipoDAL: TipoDAL.Agregar);
            if (respuesta.Estatus) AutorizacionDocumentos.RegistrarPendiente((int)Menus.EntradaUnidad, codigo);
            return respuesta;
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codEntradaProducto"] = "A.[CodEntradasCombustible]",
                ["fecha"] = "A.[Fecha]",
                ["suplidor"] = "S.[Suplidor]",
                ["producto"] = "P.[Producto]",
                ["siglasUnidad"] = "A.[SiglasUnidad]",
                ["cantidadEstandar"] = "A.[CantidadEstandar]",
                ["cantidadAmbiente"] = "A.[CantidadAmbiente]"
            };
            string where = "WHERE 1 = 1 " + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
            {
                "CONVERT(VARCHAR(20), A.[CodEntradasCombustible])", "CONVERT(VARCHAR(10), A.[Fecha], 103)", "S.[Suplidor]", "P.[Producto]", "A.[SiglasUnidad]",
                "CONVERT(VARCHAR(30), A.[CantidadEstandar])", "CONVERT(VARCHAR(30), A.[CantidadAmbiente])"
            });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodEntradasCombustible] DESC");
            return "SELECT A.[CodEntradasCombustible] AS [CodEntradaProducto],A.[Fecha],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],A.[SiglasUnidad],A.[CantidadEstandar],A.[CantidadAmbiente],"
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] FROM EntradasCombustible A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + where + "ORDER BY " + orderBy + PaginacionSql.OffsetFetch(paginacion);
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
            return "SELECT A.[" + llave + "] AS [CodEntradaProducto],A.[Fecha],A.[CodSuplidor],ISNULL(S.[Suplidor], '') AS [Suplidor],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],A.[SiglasUnidad],A.[CantidadEstandar],A.[CantidadAmbiente],"
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] FROM " + tabla + " A "
                + "LEFT JOIN Suplidor S ON A.[CodSuplidor]=S.[CodSuplidor] LEFT JOIN Producto P ON A.[CodProducto]=P.[CodProducto] "
                + where + "ORDER BY " + orderBy + PaginacionSql.OffsetFetch(paginacion);
        }

        private bool EsProductoCombustible(int codProducto)
        {
            string query = "SELECT 1 FROM Producto P INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE P.[CodProducto] = " + codProducto + " AND UPPER(TP.[Descripcion]) = UPPER('Combustibles')";
            return ObjDAL.EjecutarExiste(query);
        }

        private EntradasProductoDTO MapEntradaProducto(SqlDataReader reader)
        {
            EntradasProductoDTO entrada = new EntradasProductoDTO
            {
                CodEntradaProducto = Convert.ToInt32(reader["CodEntradaProducto"]),
                Fecha = reader["Fecha"] == DBNull.Value ? null : Convert.ToDateTime(reader["Fecha"]),
                CodSuplidor = Convert.ToInt32(reader["CodSuplidor"]),
                Suplidor = reader["Suplidor"].ToString() ?? "",
                CodProducto = Convert.ToInt32(reader["CodProducto"]),
                Producto = reader["Producto"].ToString() ?? "",
                SiglasUnidad = reader["SiglasUnidad"].ToString() ?? "",
                CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]),
                CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"])
            };
            entrada.IdEntradaProducto = ObjEncriptacion.Encriptar(entrada.CodEntradaProducto.ToString());
            entrada.IdSuplidor = ObjEncriptacion.Encriptar(entrada.CodSuplidor.ToString());
            entrada.IdProducto = ObjEncriptacion.Encriptar(entrada.CodProducto.ToString());
            return entrada;
        }
    }
}
