using app.Models.Paginacion;
using app.Messages;
using System;
using System.Collections.Generic;

namespace app.Models.LogModificaciones
{
    /// <summary>Acceso a datos del modulo LogModificacion.</summary>
    internal class LogModificacionDAO
    {
        private const string TablaLog = "LogModificacion";
        private DAL ObjDAL = new DAL();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal static void Registrar(
            string Tabla,
            string Accion,
            string Llave,
            string Descripcion = "",
            object? Anterior = null,
            object? Nuevo = null)
        {
            try
            {
                new LogModificacionDAO().Agregar(Tabla, Accion, Llave, Descripcion, Anterior, Nuevo);
            }
            catch
            {
            }
        }

        internal static void RegistrarConUsuario(
            string CodUsuario,
            string Tabla,
            string Accion,
            string Llave,
            string Descripcion = "",
            object? Anterior = null,
            object? Nuevo = null)
        {
            try
            {
                new LogModificacionDAO().AgregarConUsuario(CodUsuario, Tabla, Accion, Llave, Descripcion, Anterior, Nuevo);
            }
            catch
            {
            }
        }

        private string SesionUsuario()
        {
            try
            {
                return new VerificarUsuario().SesionUsuario();
            }
            catch
            {
                return "";
            }
        }

        internal PaginacionResultado<LogModificacionDTO> Listado()
        {
            return Listado(page: 1, pageSize: PaginacionParametros.DefaultPageSize);
        }

        internal PaginacionResultado<LogModificacionDTO> Listado(
            string Tabla = "",
            string Accion = "",
            string CodUsuario = "",
            DateTime? FechaInicio = null,
            DateTime? FechaFin = null,
            string Texto = "",
            int page = 1,
            int pageSize = 50,
            string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, Texto, sort);
            int totalCount = 0;
            List<LogModificacionDTO> items = ObjDAL.EjecutarReader(
                QueryListadoGeneral(Tabla, Accion, CodUsuario, FechaInicio, FechaFin, paginacion),
                reader =>
                {
                    if (totalCount == 0)
                        totalCount = PaginacionSql.LeerTotal(reader);

                    return MapLogModificacion(reader);
                });

            return new PaginacionResultado<LogModificacionDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<LogModificacionDTO> Listado(string Tabla, string Llave)
        {
            return ObjDAL.EjecutarReader(QueryListado(Tabla, Llave), MapLogModificacion);
        }

        internal LogModificacionDTO Obtener(int CodLogModificacion)
        {
            return ObjDAL.EjecutarReader(
                Query(TipoDAL.Obtener, CodKey: CodLogModificacion),
                MapLogModificacion).FirstOrDefault() ?? new LogModificacionDTO();
        }

        internal List<string> ListarModulos()
        {
            return ObjDAL.EjecutarReader(
                "SELECT DISTINCT Tabla FROM " + TablaLog + " WHERE ISNULL(Tabla, '') <> '' ORDER BY Tabla",
                reader => reader["Tabla"].ToString() ?? "");
        }

        internal MsjDB Agregar(
            string Tabla,
            string Accion,
            string Llave,
            string Descripcion = "",
            object? Anterior = null,
            object? Nuevo = null)
        {
            return AgregarInterno(SesionUsuario(), Tabla, Accion, Llave, Descripcion, Anterior, Nuevo);
        }

        internal MsjDB AgregarConUsuario(
            string CodUsuario,
            string Tabla,
            string Accion,
            string Llave,
            string Descripcion = "",
            object? Anterior = null,
            object? Nuevo = null)
        {
            return AgregarInterno(CodUsuario, Tabla, Accion, Llave, Descripcion, Anterior, Nuevo);
        }

        private MsjDB AgregarInterno(
            string CodUsuario,
            string Tabla,
            string Accion,
            string Llave,
            string Descripcion = "",
            object? Anterior = null,
            object? Nuevo = null)
        {
            LogModificacionDTO Obj = new LogModificacionDTO();
            Obj.CodUsuario = CodUsuario;
            Obj.Tabla = Tabla;
            Obj.Accion = Accion;
            Obj.Llave = Llave;
            Obj.Descripcion = !string.IsNullOrWhiteSpace(Descripcion)
                ? Descripcion
                : ComparacionObjetos.ObtenerCambios(Anterior, Nuevo);

            try
            {
                return ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);
            }
            catch (Exception)
            {
                return ManejadorErrores.CrearRespuesta(TipoError.ServidorInterno);
            }
        }

        internal string Query(
            TipoDAL TipoDAL = TipoDAL.NoSeleccionado,
            int CodKey = 0,
            LogModificacionDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO " + TablaLog + "(Fecha,CodUsuario,Tabla,Accion,Llave,Descripcion) VALUES(GETDATE(),'"
                        + SqlTexto(Obj?.CodUsuario) + "','"
                        + SqlTexto(Obj?.Tabla) + "','"
                        + SqlTexto(Obj?.Accion) + "','"
                        + SqlTexto(Obj?.Llave) + "','"
                        + SqlTexto(Obj?.Descripcion) + "')";

                case TipoDAL.Listado:
                    return "SELECT CodLogModificacion,Fecha,CodUsuario,Tabla,Accion,Llave,Descripcion "
                        + "FROM " + TablaLog + " ORDER BY Fecha DESC, CodLogModificacion DESC "
                        + "OFFSET 0 ROWS FETCH NEXT " + PaginacionParametros.DefaultPageSize + " ROWS ONLY";

                case TipoDAL.Obtener:
                    return "SELECT CodLogModificacion,Fecha,CodUsuario,Tabla,Accion,Llave,Descripcion "
                        + "FROM " + TablaLog + " "
                        + "WHERE CodLogModificacion = '" + CodKey + "'";

                default:
                    return "";
            }
        }

        private LogModificacionDTO MapLogModificacion(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            LogModificacionDTO Obj = new LogModificacionDTO();
            Obj.CodLogModificacion = Convert.ToInt32(reader["CodLogModificacion"]);
            Obj.IdLogModificacion = ObjEncriptacion.Encriptar(Obj.CodLogModificacion.ToString());
            Obj.Fecha = Convert.ToDateTime(reader["Fecha"]);
            Obj.CodUsuario = reader["CodUsuario"].ToString() ?? "";
            Obj.Tabla = reader["Tabla"].ToString() ?? "";
            Obj.Accion = reader["Accion"].ToString() ?? "";
            Obj.Llave = reader["Llave"].ToString() ?? "";
            Obj.Descripcion = reader["Descripcion"].ToString() ?? "";
            return Obj;
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string QueryListado(string Tabla, string Llave)
        {
            return "SELECT CodLogModificacion,Fecha,CodUsuario,Tabla,Accion,Llave,Descripcion "
                + "FROM " + TablaLog + " "
                + "WHERE Tabla = '" + SqlTexto(Tabla) + "' "
                + "AND Llave = '" + SqlTexto(Llave) + "' "
                + "ORDER BY Fecha DESC, CodLogModificacion DESC ";
        }

        private string QueryListadoGeneral(
            string Tabla,
            string Accion,
            string CodUsuario,
            DateTime? FechaInicio,
            DateTime? FechaFin,
            PaginacionParametros paginacion)
        {
            string where = "WHERE 1 = 1 ";

            if (!string.IsNullOrWhiteSpace(Tabla))
                where += "AND Tabla LIKE '%" + SqlTexto(Tabla) + "%' ";

            if (!string.IsNullOrWhiteSpace(Accion))
                where += "AND Accion = '" + SqlTexto(Accion) + "' ";

            if (!string.IsNullOrWhiteSpace(CodUsuario))
                where += "AND CodUsuario LIKE '%" + SqlTexto(CodUsuario) + "%' ";

            if (FechaInicio.HasValue)
                where += "AND Fecha >= '" + FechaInicio.Value.ToString("yyyyMMdd HH:mm:ss") + "' ";

            if (FechaFin.HasValue)
                where += "AND Fecha <= '" + FechaFin.Value.ToString("yyyyMMdd HH:mm:ss") + "' ";

            if (!string.IsNullOrWhiteSpace(paginacion.Search))
            {
                string texto = SqlTexto(paginacion.Search);
                where += "AND (Tabla LIKE '%" + texto + "%' "
                    + "OR Accion LIKE '%" + texto + "%' "
                    + "OR Llave LIKE '%" + texto + "%' "
                    + "OR CodUsuario LIKE '%" + texto + "%' "
                    + "OR Descripcion LIKE '%" + texto + "%' "
                    + "OR (CONVERT(VARCHAR(10), Fecha, 103) + ' ' + LEFT(CONVERT(VARCHAR(8), Fecha, 108), 5)) LIKE '%" + texto + "%' "
                    + "OR (CONVERT(VARCHAR(10), Fecha, 101) + ' ' + LEFT(CONVERT(VARCHAR(8), Fecha, 108), 5)) LIKE '%" + texto + "%' "
                    + "OR CONVERT(VARCHAR(16), Fecha, 120) LIKE '%" + texto + "%' "
                    + "OR CONVERT(VARCHAR(8), Fecha, 108) LIKE '%" + texto + "%') ";
            }

            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codLogModificacion"] = "CodLogModificacion",
                ["fecha"] = "Fecha",
                ["codUsuario"] = "CodUsuario",
                ["tabla"] = "Tabla",
                ["accion"] = "Accion",
                ["llave"] = "Llave",
                ["descripcion"] = "Descripcion"
            };
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "Fecha DESC, CodLogModificacion DESC");

            return "SELECT CodLogModificacion,Fecha,CodUsuario,Tabla,Accion,Llave,Descripcion, "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM " + TablaLog + " "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }
    }
}



