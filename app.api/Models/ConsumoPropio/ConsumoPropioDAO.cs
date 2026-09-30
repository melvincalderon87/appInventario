using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace app.Models.ConsumoPropio
{
    /// <summary>
    /// DAO para el mantenimiento de consumo propio por medicion.
    /// </summary>
    internal class ConsumoPropioDAO
    {
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<ConsumoPropioDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "", string CodTanque = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<ConsumoPropioDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, CodTanque), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapConsumoPropio(reader);
            });

            return new PaginacionResultado<ConsumoPropioDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodConsumoPropio"].ToString()
            });
        }

        internal ConsumoPropioDTO Obtener(int CodConsumoPropio)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodConsumoPropio), MapConsumoPropio).FirstOrDefault() ?? new ConsumoPropioDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(ConsumoPropioDTO Obj)
        {
            Obj.CodConsumoPropio = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararCantidades(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                RecalcularTanque(Obj.CodTanque);
                LogModificacionDAO.Registrar("ConsumoPropio", "CREADO", "CodConsumoPropio:" + Obj.CodConsumoPropio, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(ConsumoPropioDTO Obj)
        {
            ConsumoPropioDTO ObjAnterior = Obtener(Obj.CodConsumoPropio);
            Obj.Version = ObtenerVersion(Obj.CodConsumoPropio);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararCantidades(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                if (!string.IsNullOrWhiteSpace(ObjAnterior.CodTanque) && ObjAnterior.CodTanque != Obj.CodTanque)
                    RecalcularTanque(ObjAnterior.CodTanque);

                RecalcularTanque(Obj.CodTanque);
                LogModificacionDAO.Registrar("ConsumoPropio", "EDITADO", "CodConsumoPropio:" + Obj.CodConsumoPropio, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(ConsumoPropioDTO Obj)
        {
            ConsumoPropioDTO ObjAnterior = Obtener(Obj.CodConsumoPropio);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                if (!string.IsNullOrWhiteSpace(ObjAnterior.CodTanque))
                    RecalcularTanque(ObjAnterior.CodTanque);

                LogModificacionDAO.Registrar("ConsumoPropio", "ELIMINADO", "CodConsumoPropio:" + Obj.CodConsumoPropio, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal int ObtenerVersion(int CodConsumoPropio)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodConsumoPropio), 1);
        }

        internal List<ConsumoPropioDTO> Log(int CodConsumoPropio)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodConsumoPropio), MapConsumoPropioLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, ConsumoPropioDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO ConsumoPropio (CodConsumoPropio,CodTanque,Fecha,Pies,Pulgadas,Dieciseisavos,CantidadAnterior,Cantidad,CantidadActual,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj.CodConsumoPropio + "',N'"
                            + SqlTexto(Obj.CodTanque) + "',"
                            + SqlFecha(Obj.Fecha) + ",'"
                            + Obj.Pies + "','"
                            + Obj.Pulgadas + "','"
                            + Obj.Dieciseisavos + ","
                            + SqlNumero(Obj.CantidadAnterior) + ","
                            + SqlNumero(Obj.Cantidad) + ","
                            + SqlNumero(Obj.CantidadActual) + ",'"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE ConsumoPropio SET "
                            + "CodTanque=N'" + SqlTexto(Obj.CodTanque) + "',"
                            + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                            + "Pies='" + Obj.Pies + "',"
                            + "Pulgadas='" + Obj.Pulgadas + "',"
                            + "Dieciseisavos='" + Obj.Dieciseisavos + "',"
                            + "CantidadAnterior=" + SqlNumero(Obj.CantidadAnterior) + ","
                            + "Cantidad=" + SqlNumero(Obj.Cantidad) + ","
                            + "CantidadActual=" + SqlNumero(Obj.CantidadActual) + ","
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodConsumoPropio='" + Obj.CodConsumoPropio + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM ConsumoPropio WHERE CodConsumoPropio='" + Obj.CodConsumoPropio + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodConsumoPropio],CONCAT(T.[Tanque], ' - ', CONVERT(VARCHAR(10), A.[Fecha], 103), ' - ', A.[Pies], ''' ', A.[Pulgadas], " + SqlFraccionAltura("A") + ", '\"') AS [Descripcion] FROM ConsumoPropio A LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodConsumoPropio]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodConsumoPropio]),0)+1 as 'CodConsumoPropio' FROM ConsumoPropio A ";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM ConsumoPropio_LOG UNION ALL SELECT * FROM ConsumoPropio) A " +
                        "WHERE A.[CodConsumoPropio]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodConsumoPropio], A.[CodTanque], ISNULL(T.[Tanque], '') AS [Tanque], "
                      + "A.[Fecha], A.[Pies], A.[Pulgadas], A.[Dieciseisavos], A.[CantidadAnterior], A.[Cantidad], A.[CantidadActual],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                      + "FROM (SELECT * FROM ConsumoPropio_LOG UNION ALL SELECT * FROM ConsumoPropio) A "
                      + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                      + "WHERE A.[CodConsumoPropio] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodConsumoPropio],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[Fecha],A.[Pies],A.[Pulgadas],A.[Dieciseisavos],A.[CantidadAnterior],A.[Cantidad],A.[CantidadActual] "
                + "FROM ConsumoPropio A "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] ";
        }

        private string QueryListado(PaginacionParametros paginacion, string CodTanque = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codConsumoPropio"] = "A.[CodConsumoPropio]",
                ["codTanque"] = "A.[CodTanque]",
                ["tanque"] = "T.[Tanque]",
                ["fecha"] = "A.[Fecha]",
                ["pies"] = "A.[Pies]",
                ["pulgadas"] = "A.[Pulgadas]",
                ["dieciseisavos"] = "A.[Dieciseisavos]",
                ["cantidadAnterior"] = "A.[CantidadAnterior]",
                ["cantidad"] = "A.[Cantidad]",
                ["cantidadActual"] = "A.[CantidadActual]"
            };
            CodTanque = (CodTanque ?? "").Trim();
            string where = "WHERE 1 = 1 "
                + (!string.IsNullOrWhiteSpace(CodTanque) ? "AND A.[CodTanque] = N'" + SqlTexto(CodTanque) + "' " : "")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodConsumoPropio])",
                    "CONVERT(VARCHAR(20), A.[CodTanque])",
                    "T.[Tanque]",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "CONVERT(VARCHAR(20), A.[Pies])",
                    "CONVERT(VARCHAR(20), A.[Pulgadas])",
                    "CONVERT(VARCHAR(20), A.[Dieciseisavos])",
                    "CONVERT(VARCHAR(30), A.[CantidadAnterior])",
                    "CONVERT(VARCHAR(30), A.[Cantidad])",
                    "CONVERT(VARCHAR(30), A.[CantidadActual])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodConsumoPropio] DESC");

            return "SELECT A.[CodConsumoPropio],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[Fecha],A.[Pies],A.[Pulgadas],A.[Dieciseisavos],A.[CantidadAnterior],A.[Cantidad],A.[CantidadActual], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM ConsumoPropio A "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private MsjDB PrepararCantidades(ConsumoPropioDTO Obj)
        {
            if (!TanqueHabilitadoConsumoPropio(Obj.CodTanque))
                return Error("El tanque debe ser de tipo combustible y estar marcado como consumo propio.");

            decimal? cantidadActual = ObtenerCantidadActualPorMedicion(Obj.CodTanque, Obj.Pies, Obj.Pulgadas, Obj.Dieciseisavos);

            if (!cantidadActual.HasValue)
                return Error("No existe capacidad volumetrica para la medicion ingresada.");

            Obj.CantidadActual = cantidadActual.Value;
            Obj.CantidadAnterior = ObtenerCantidadAnterior(Obj);
            Obj.Cantidad = Obj.CantidadActual - Obj.CantidadAnterior;

            return Ok();
        }

        private decimal? ObtenerCantidadActualPorMedicion(string CodTanque, int Pies, int Pulgadas, int Dieciseisavos)
        {
            List<decimal> capacidades = ObjDAL.EjecutarReader(
                QueryObtenerCantidadActualPorMedicion(CodTanque, Pies, Pulgadas, Dieciseisavos),
                reader => Convert.ToDecimal(reader["Capacidad"]));

            return capacidades.Count > 0 ? capacidades[0] : null;
        }

        private decimal ObtenerCantidadAnterior(ConsumoPropioDTO Obj)
        {
            return ObjDAL.EjecutarScalar(QueryObtenerCantidadAnterior(Obj), 0m);
        }

        private bool TanqueHabilitadoConsumoPropio(string CodTanque)
        {
            return ObjDAL.EjecutarExiste(QueryTanqueHabilitadoConsumoPropio(CodTanque));
        }

        private void RecalcularTanque(string CodTanque)
        {
            if (string.IsNullOrWhiteSpace(CodTanque))
                return;

            decimal cantidadAnterior = 0m;
            List<ConsumoPropioDTO> registros = ObjDAL.EjecutarReader(QueryRegistrosTanque(CodTanque), MapConsumoPropio);

            foreach (ConsumoPropioDTO registro in registros)
            {
                decimal? cantidadActualCalculada = ObtenerCantidadActualPorMedicion(registro.CodTanque, registro.Pies, registro.Pulgadas, registro.Dieciseisavos);
                if (!cantidadActualCalculada.HasValue)
                    continue;

                decimal cantidadActual = cantidadActualCalculada.Value;
                decimal cantidad = cantidadActual - cantidadAnterior;
                ObjDAL.Ejecutar(QueryActualizarCantidades(registro.CodConsumoPropio, cantidadAnterior, cantidad, cantidadActual), Key: false);
                cantidadAnterior = cantidadActual;
            }
        }

        private string QueryObtenerCantidadActualPorMedicion(string CodTanque, int Pies, int Pulgadas, int Dieciseisavos)
        {
            return "SELECT TOP 1 D.[Volumen] AS [Capacidad] "
                + "FROM CapacidadVolumetricaTanque A "
                + "INNER JOIN CapacidadVolumetricaTanqueDetalle D ON A.[CodCapacidadVolumetricaTanque] = D.[CodCapacidadVolumetricaTanque] "
                + "INNER JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + "WHERE A.[CodTanque] = N'" + SqlTexto(CodTanque) + "' "
                + "AND A.[CodProducto] = T.[CodProducto] "
                + "AND ISNULL(A.[Estatus], 1) = 1 "
                + "AND ISNULL(A.[EsActual], 0) = 1 "
                + "AND ISNULL(D.[Estatus], 1) = 1 "
                + "AND D.[Pies] = '" + Pies + "' "
                + "AND D.[Pulgadas] = '" + Pulgadas + "' "
                + "AND D.[Dieciseisavos] = '" + Dieciseisavos + "' "
                + "ORDER BY A.[FechaCalibracion] DESC, A.[FechaCreacion] DESC, A.[CodCapacidadVolumetricaTanque] DESC";
        }

        private string QueryTanqueHabilitadoConsumoPropio(string CodTanque)
        {
            return "SELECT 1 "
                + "FROM Tanque T "
                + "INNER JOIN Producto P ON T.[CodProducto] = P.[CodProducto] "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE T.[CodTanque] = N'" + SqlTexto(CodTanque) + "' "
                + "AND T.[ConsumoPropio] = 1 "
                + "AND UPPER(TP.[Descripcion]) IN (UPPER('Combustible'), UPPER('Combustible'))";
        }

        private string QueryObtenerCantidadAnterior(ConsumoPropioDTO Obj)
        {
            return "SELECT TOP 1 A.[CantidadActual] "
                + "FROM ConsumoPropio A "
                + "WHERE A.[CodTanque] = N'" + SqlTexto(Obj.CodTanque) + "' "
                + "AND A.[CodConsumoPropio] <> '" + Obj.CodConsumoPropio + "' "
                + "AND (A.[Fecha] < " + SqlFecha(Obj.Fecha) + " "
                + "OR (A.[Fecha] = " + SqlFecha(Obj.Fecha) + " AND A.[CodConsumoPropio] < '" + Obj.CodConsumoPropio + "')) "
                + "ORDER BY A.[Fecha] DESC, A.[CodConsumoPropio] DESC";
        }

        private string QueryRegistrosTanque(string CodTanque)
        {
            return SelectBase()
                + "WHERE A.[CodTanque] = N'" + SqlTexto(CodTanque) + "' "
                + "ORDER BY A.[Fecha] ASC, A.[CodConsumoPropio] ASC";
        }

        private string QueryActualizarCantidades(int CodConsumoPropio, decimal CantidadAnterior, decimal Cantidad, decimal CantidadActual)
        {
            return "UPDATE ConsumoPropio SET "
                + "CantidadAnterior=" + SqlNumero(CantidadAnterior) + ","
                + "Cantidad=" + SqlNumero(Cantidad) + ","
                + "CantidadActual=" + SqlNumero(CantidadActual) + " "
                + "WHERE CodConsumoPropio='" + CodConsumoPropio + "' "
                + "AND (CantidadAnterior <> " + SqlNumero(CantidadAnterior) + " "
                + "OR Cantidad <> " + SqlNumero(Cantidad) + " "
                + "OR CantidadActual <> " + SqlNumero(CantidadActual) + ")";
        }

        private ConsumoPropioDTO MapConsumoPropio(SqlDataReader reader)
        {
            ConsumoPropioDTO Obj = new ConsumoPropioDTO();
            Obj.CodConsumoPropio = Convert.ToInt32(reader["CodConsumoPropio"]);
            Obj.IdConsumoPropio = ObjEncriptacion.Encriptar(Obj.CodConsumoPropio.ToString());
            Obj.CodTanque = reader["CodTanque"].ToString() ?? "";
            Obj.IdTanque = ObjEncriptacion.Encriptar(Obj.CodTanque);
            Obj.Tanque = reader["Tanque"].ToString() ?? "";
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.Pies = Convert.ToInt32(reader["Pies"]);
            Obj.Pulgadas = Convert.ToInt32(reader["Pulgadas"]);
            Obj.Dieciseisavos = Convert.ToInt32(reader["Dieciseisavos"]);
            Obj.CantidadAnterior = Convert.ToDecimal(reader["CantidadAnterior"]);
            Obj.Cantidad = Convert.ToDecimal(reader["Cantidad"]);
            Obj.CantidadActual = Convert.ToDecimal(reader["CantidadActual"]);
            return Obj;
        }

        private ConsumoPropioDTO MapConsumoPropioLog(SqlDataReader reader)
        {
            ConsumoPropioDTO Obj = MapConsumoPropio(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion.ToString());

            Obj.FechaCreacion = Fecha(reader["FechaCreacion"]);

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion.ToString());

            Obj.FechaActualizacion = Fecha(reader["FechaActualizacion"]);
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
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

        private string SqlFraccionAltura(string alias)
        {
            return "CASE WHEN " + alias + ".[Dieciseisavos] > 0 "
                + "THEN CONCAT(' ', " + alias + ".[Dieciseisavos], '/16') ELSE '' END";
        }
    }
}




