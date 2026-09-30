using app.Models.Paginacion;
using System;
using System.Collections.Generic;

namespace app.Models.Auditorias
{
    /// <summary>
    /// Clase para manejar la persistencia de la auditoria.
    /// </summary>
    internal class AuditoriaDAO
    {
        private const string TablaAuditoria = "Auditoria";
        private DAL ObjDAL = new DAL();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<AuditoriaDTO> Listado()
        {
            return Listado(page: 1, pageSize: PaginacionParametros.DefaultPageSize);
        }

        internal PaginacionResultado<AuditoriaDTO> Listado(
            string Controlador = "",
            string Accion = "",
            string CodUsuario = "",
            string Metodo = "",
            DateTime? FechaInicio = null,
            DateTime? FechaFin = null,
            string Texto = "",
            int page = 1,
            int pageSize = 50,
            string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, Texto, sort);
            int totalCount = 0;
            List<AuditoriaDTO> items = ObjDAL.EjecutarReader(
                QueryListadoGeneral(Controlador, Accion, CodUsuario, Metodo, FechaInicio, FechaFin, paginacion),
                reader =>
                {
                    if (totalCount == 0)
                        totalCount = PaginacionSql.LeerTotal(reader);

                    return MapAuditoria(reader);
                });

            return new PaginacionResultado<AuditoriaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal AuditoriaDTO Obtener(int CodAuditoria)
        {
            return ObjDAL.EjecutarReader(
                Query(TipoDAL.Obtener, CodKey: CodAuditoria),
                MapAuditoria).FirstOrDefault() ?? new AuditoriaDTO();
        }

        internal List<string> ListarControladores()
        {
            return ObjDAL.EjecutarReader(
                "SELECT DISTINCT Controlador FROM " + TablaAuditoria + " WHERE ISNULL(Controlador, '') <> '' ORDER BY Controlador",
                reader => reader["Controlador"].ToString() ?? "");
        }

        /// <summary>
        /// Agrega una nueva entrada de auditoria.
        /// </summary>
        /// <param name="Obj"></param>
        /// <returns></returns>
        internal MsjDB Agregar(AuditoriaDTO Obj)
        {
            return ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);
        }

        /// <summary>
        /// Genera la consulta SQL para la operacion de auditoria.
        /// </summary>
        /// <param name="TipoDAL"></param>
        /// <param name="CodKey"></param>
        /// <param name="Obj"></param>
        /// <returns></returns>
        internal string Query(
            TipoDAL TipoDAL = TipoDAL.NoSeleccionado,
            int CodKey = 0,
            AuditoriaDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    if (Obj == null)
                    {
                        return "";
                    }

                    string Conectado = SqlDate(Obj.Conectado);
                    string Desconectado = SqlDate(Obj.Desconectado);
                    return "INSERT INTO " + TablaAuditoria + " (CodUsuario,SesionID,IpAddress,PaginaAccedida,Conectado,"
                        + "Desconectado,EstadoSesion,Controlador,Accion,Url,Metodo) VALUES('"
                        + SqlTexto(Obj.CodUsuario) + "','" + SqlTexto(Obj.SesionID) + "','" + SqlTexto(Obj.IpAddress) + "','" + SqlTexto(Obj.PaginaAccedida) + "',"
                        + Conectado + "," + Desconectado + ",'" + SqlTexto(Obj.EstadoSesion) + "','" + SqlTexto(Obj.Controlador) + "','"
                        + SqlTexto(Obj.Accion) + "','" + SqlTexto(Obj.Url) + "','" + SqlTexto(Obj.Metodo) + "')";

                case TipoDAL.Listado:
                    return "SELECT CodAuditoria,CodUsuario,SesionID,IpAddress,PaginaAccedida,Conectado,Desconectado,"
                        + "EstadoSesion,Controlador,Accion,Url,Metodo "
                        + "FROM " + TablaAuditoria + " ORDER BY Conectado DESC, CodAuditoria DESC "
                        + "OFFSET 0 ROWS FETCH NEXT " + PaginacionParametros.DefaultPageSize + " ROWS ONLY";

                case TipoDAL.Obtener:
                    return "SELECT CodAuditoria,CodUsuario,SesionID,IpAddress,PaginaAccedida,Conectado,Desconectado,"
                        + "EstadoSesion,Controlador,Accion,Url,Metodo "
                        + "FROM " + TablaAuditoria + " "
                        + "WHERE CodAuditoria = '" + CodKey + "'";

                default:
                    return "";
            }
        }

        private AuditoriaDTO MapAuditoria(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            AuditoriaDTO Obj = new AuditoriaDTO();
            Obj.CodAuditoria = Convert.ToInt32(reader["CodAuditoria"]);
            Obj.IdAuditoria = ObjEncriptacion.Encriptar(Obj.CodAuditoria.ToString());
            Obj.CodUsuario = reader["CodUsuario"].ToString() ?? "";
            Obj.SesionID = reader["SesionID"].ToString() ?? "";
            Obj.IpAddress = reader["IpAddress"].ToString() ?? "";
            Obj.PaginaAccedida = reader["PaginaAccedida"].ToString() ?? "";
            Obj.Conectado = ReadDate(reader, "Conectado");
            Obj.Desconectado = ReadDate(reader, "Desconectado");
            Obj.EstadoSesion = reader["EstadoSesion"].ToString() ?? "";
            Obj.Controlador = reader["Controlador"].ToString() ?? "";
            Obj.Accion = reader["Accion"].ToString() ?? "";
            Obj.Url = reader["Url"].ToString() ?? "";
            Obj.Metodo = reader["Metodo"].ToString() ?? "";
            return Obj;
        }

        private DateTime? ReadDate(Microsoft.Data.SqlClient.SqlDataReader reader, string fieldName)
        {
            int ordinal = reader.GetOrdinal(fieldName);

            if (reader.IsDBNull(ordinal))
            {
                return null;
            }

            return Convert.ToDateTime(reader[fieldName]);
        }

        private string QueryListadoGeneral(
            string Controlador,
            string Accion,
            string CodUsuario,
            string Metodo,
            DateTime? FechaInicio,
            DateTime? FechaFin,
            PaginacionParametros paginacion)
        {
            string where = "WHERE 1 = 1 ";

            if (!string.IsNullOrWhiteSpace(Controlador))
                where += "AND Controlador LIKE '%" + SqlTexto(Controlador) + "%' ";

            if (!string.IsNullOrWhiteSpace(Accion))
                where += "AND Accion LIKE '%" + SqlTexto(Accion) + "%' ";

            if (!string.IsNullOrWhiteSpace(CodUsuario))
                where += "AND CodUsuario LIKE '%" + SqlTexto(CodUsuario) + "%' ";

            if (!string.IsNullOrWhiteSpace(Metodo))
                where += "AND Metodo = '" + SqlTexto(Metodo) + "' ";

            if (FechaInicio.HasValue)
                where += "AND Conectado >= '" + FechaInicio.Value.ToString("yyyyMMdd HH:mm:ss") + "' ";

            if (FechaFin.HasValue)
                where += "AND Conectado <= '" + FechaFin.Value.ToString("yyyyMMdd HH:mm:ss") + "' ";

            if (!string.IsNullOrWhiteSpace(paginacion.Search))
            {
                string texto = SqlTexto(paginacion.Search);
                where += "AND (CodUsuario LIKE '%" + texto + "%' "
                    + "OR SesionID LIKE '%" + texto + "%' "
                    + "OR IpAddress LIKE '%" + texto + "%' "
                    + "OR PaginaAccedida LIKE '%" + texto + "%' "
                    + "OR EstadoSesion LIKE '%" + texto + "%' "
                    + "OR Controlador LIKE '%" + texto + "%' "
                    + "OR Accion LIKE '%" + texto + "%' "
                    + "OR Url LIKE '%" + texto + "%' "
                    + "OR Metodo LIKE '%" + texto + "%' "
                    + "OR (CONVERT(VARCHAR(10), Conectado, 103) + ' ' + LEFT(CONVERT(VARCHAR(8), Conectado, 108), 5)) LIKE '%" + texto + "%' "
                    + "OR (CONVERT(VARCHAR(10), Conectado, 101) + ' ' + LEFT(CONVERT(VARCHAR(8), Conectado, 108), 5)) LIKE '%" + texto + "%' "
                    + "OR CONVERT(VARCHAR(16), Conectado, 120) LIKE '%" + texto + "%' "
                    + "OR CONVERT(VARCHAR(8), Conectado, 108) LIKE '%" + texto + "%') ";
            }

            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codAuditoria"] = "CodAuditoria",
                ["codUsuario"] = "CodUsuario",
                ["sesionID"] = "SesionID",
                ["ipAddress"] = "IpAddress",
                ["paginaAccedida"] = "PaginaAccedida",
                ["conectado"] = "Conectado",
                ["desconectado"] = "Desconectado",
                ["estadoSesion"] = "EstadoSesion",
                ["controlador"] = "Controlador",
                ["accion"] = "Accion",
                ["url"] = "Url",
                ["metodo"] = "Metodo"
            };
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "Conectado DESC, CodAuditoria DESC");

            return "SELECT CodAuditoria,CodUsuario,SesionID,IpAddress,PaginaAccedida,Conectado,Desconectado,"
                + "EstadoSesion,Controlador,Accion,Url,Metodo "
                + ",COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM " + TablaAuditoria + " "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string SqlDate(DateTime? value)
        {
            return value == null
                ? "NULL"
                : "CAST(N'" + value.Value.ToString("yyyy-MM-ddTHH:mm:ss") + "' AS SmallDateTime)";
        }

        private string SqlTexto(string? value)
        {
            return (value ?? "").Replace("'", "''");
        }

    }
}


