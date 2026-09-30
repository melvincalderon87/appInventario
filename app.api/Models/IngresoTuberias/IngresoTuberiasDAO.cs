using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;
using System.Text;

namespace app.Models.IngresoTuberias
{
    /// <summary>
    /// DAO para el registro de ingresos por tuberias.
    /// </summary>
    internal class IngresoTuberiasDAO
    {
        private readonly DAL ObjDAL = new DAL();

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal List<SelectListItem> ListarProductosCombustible()
        {
            const string query = "SELECT P.[CodProducto], P.[Producto] FROM Producto P "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE UPPER(TP.[Descripcion]) = UPPER('Combustible') ORDER BY P.[Producto]";
            return ObjDAL.EjecutarReader(query, reader => new SelectListItem
            {
                Value = reader["CodProducto"].ToString(),
                Text = reader["Producto"].ToString()
            });
        }

        internal PaginacionResultado<IngresoTuberiasDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<IngresoTuberiasDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0) totalCount = PaginacionSql.LeerTotal(reader);
                return new IngresoTuberiasDTO { CodIngresoTuberias = Convert.ToInt32(reader["CodIngresoTuberias"]), Fecha = reader["Fecha"] == DBNull.Value ? null : Convert.ToDateTime(reader["Fecha"]), Barco = reader["Barco"].ToString() ?? "", Suplidor = reader["Suplidor"].ToString() ?? "", Producto = reader["Producto"].ToString() ?? "", CantidadEstandar = Convert.ToDecimal(reader["CantidadEstandar"]), CantidadAmbiente = Convert.ToDecimal(reader["CantidadAmbiente"]) };
            });
            return new PaginacionResultado<IngresoTuberiasDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal MsjDB Agregar(IngresoTuberiasDTO Obj)
        {
            Obj.CodIngresoTuberias = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararIngreso(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("IngresoTuberias", "CREADO", "CodIngresoTuberias:" + Obj.CodIngresoTuberias, Nuevo: Obj);
            }

            return msjDB;
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, IngresoTuberiasDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return QueryAgregar(Obj!);
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodIngresoTuberiasCombustible]),0)+1 as 'CodIngresoTuberias' FROM IngresoTuberiasCombustible A ";
                default:
                    return "";
            }
        }

        private MsjDB PrepararIngreso(IngresoTuberiasDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return Error("La fecha es requerida.");

            if (Obj.CodBarco <= 0)
                return Error("El barco es requerido.");

            if (Obj.CodSuplidor <= 0)
                return Error("El suplidor es requerido.");

            if (Obj.CodProducto <= 0)
                return Error("El producto es requerido.");

            if (Obj.CantidadEstandar <= 0)
                return Error("La cantidad estandar debe ser mayor a cero.");

            if (Obj.CantidadAmbiente <= 0)
                return Error("La cantidad ambiente debe ser mayor a cero.");

            if (!BarcoExiste(Obj.CodBarco))
                return Error("El barco seleccionado no existe.");

            if (!SocioExiste(Obj.CodSuplidor))
                return Error("El suplidor seleccionado no existe.");

            if (!ProductoEsCombustible(Obj.CodProducto))
                return Error("El producto seleccionado debe ser de tipo combustible.");

            Obj.Fecha = Obj.Fecha.Value.Date;

            return Ok();
        }

        private string QueryAgregar(IngresoTuberiasDTO Obj)
        {
            StringBuilder query = new StringBuilder();
            query.Append("INSERT INTO IngresoTuberiasCombustible (CodIngresoTuberiasCombustible,Fecha,CodBarco,CodSuplidor,CodProducto,CantidadEstandar,CantidadAmbiente,Version,CodUsuarioCreacion,FechaCreacion) VALUES('");
            query.Append(Obj.CodIngresoTuberias).Append("',");
            query.Append(SqlFecha(Obj.Fecha)).Append(",'");
            query.Append(Obj.CodBarco).Append("','");
            query.Append(Obj.CodSuplidor).Append("','");
            query.Append(Obj.CodProducto).Append("',");
            query.Append(SqlNumero(Obj.CantidadEstandar)).Append(",");
            query.Append(SqlNumero(Obj.CantidadAmbiente)).Append(",'");
            query.Append(Obj.Version).Append("','");
            query.Append(SqlTexto(Obj.CodUsuarioCreacion)).Append("',GETDATE())");
            return query.ToString();
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> columnas = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["fecha"] = "A.[Fecha]", ["barco"] = "B.[Barco]", ["suplidor"] = "S.[Suplidor]", ["producto"] = "P.[Producto]" };
            string where = "WHERE 1 = 1 " + PaginacionSql.WhereBusqueda(paginacion.Search, new[] { "CONVERT(VARCHAR(20), A.[CodIngresoTuberiasCombustible])", "CONVERT(VARCHAR(10), A.[Fecha], 103)", "B.[Barco]", "S.[Suplidor]", "P.[Producto]" });
            return "SELECT A.[CodIngresoTuberiasCombustible] AS [CodIngresoTuberias], A.[Fecha], ISNULL(B.[Barco], '') AS [Barco], ISNULL(S.[Suplidor], '') AS [Suplidor], ISNULL(P.[Producto], '') AS [Producto], A.[CantidadEstandar], A.[CantidadAmbiente], COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] FROM IngresoTuberiasCombustible A LEFT JOIN Barco B ON A.[CodBarco] = B.[CodBarco] LEFT JOIN Suplidor S ON A.[CodSuplidor] = S.[CodSuplidor] LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] " + where + "ORDER BY " + PaginacionSql.OrderBy(paginacion.Sort, columnas, "A.[Fecha] DESC, A.[CodIngresoTuberiasCombustible] DESC") + PaginacionSql.OffsetFetch(paginacion);
        }

        private bool BarcoExiste(int CodBarco)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Barco A WHERE A.[CodBarco]='" + CodBarco + "'");
        }

        private bool SocioExiste(int CodSuplidor)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Suplidor A WHERE A.[CodSuplidor]='" + CodSuplidor + "'");
        }

        private bool ProductoEsCombustible(int CodProducto)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Producto P INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE P.[CodProducto]='" + CodProducto + "' AND UPPER(TP.[Descripcion]) = UPPER('Combustible')");
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


