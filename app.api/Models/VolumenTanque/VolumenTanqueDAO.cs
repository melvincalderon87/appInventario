using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.VolumenTanque
{
    /// <summary>
    /// DAO para el mantenimiento de extraccion de volumen de tanque.
    /// </summary>
    internal class VolumenTanqueDAO
    {
        private const int DenominadorFraccion = 16;
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<VolumenTanqueDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "", string CodTanque = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<VolumenTanqueDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, CodTanque), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapVolumenTanque(reader);
            });

            return new PaginacionResultado<VolumenTanqueDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodDocumento"].ToString()
            });
        }

        internal VolumenTanqueDTO Obtener(int CodDocumento)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodDocumento), MapVolumenTanque).FirstOrDefault() ?? new VolumenTanqueDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(VolumenTanqueDTO Obj)
        {
            Obj.CodDocumento = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararVolumen(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
                LogModificacionDAO.Registrar("VolumenTanque", "CREADO", "CodDocumento:" + Obj.CodDocumento, Nuevo: Obj);

            return MsjDB;
        }

        internal MsjDB Editar(VolumenTanqueDTO Obj)
        {
            VolumenTanqueDTO ObjAnterior = Obtener(Obj.CodDocumento);
            Obj.Version = ObtenerVersion(Obj.CodDocumento);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararVolumen(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
                LogModificacionDAO.Registrar("VolumenTanque", "EDITADO", "CodDocumento:" + Obj.CodDocumento, Anterior: ObjAnterior, Nuevo: Obj);

            return MsjDB;
        }

        internal MsjDB Eliminar(VolumenTanqueDTO Obj)
        {
            VolumenTanqueDTO ObjAnterior = Obtener(Obj.CodDocumento);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
                LogModificacionDAO.Registrar("VolumenTanque", "ELIMINADO", "CodDocumento:" + Obj.CodDocumento, Anterior: ObjAnterior);

            return MsjDB;
        }

        internal MsjDB CalcularVolumen(VolumenTanqueDTO Obj)
        {
            MsjDB validacion = PrepararVolumen(Obj);
            if (!validacion.Estatus)
                return validacion;

            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }

        internal int ObtenerVersion(int CodDocumento)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodDocumento), 1);
        }

        internal bool EsCombustible(string codTanque)
        {
            return ObjDAL.EjecutarScalar(
                "SELECT CASE WHEN EXISTS (SELECT 1 FROM Tanque T INNER JOIN Producto P ON P.CodProducto=T.CodProducto INNER JOIN TipoProducto TP ON TP.CodTipoProducto=P.CodTipoProducto WHERE T.CodTanque=N'" + SqlTexto(codTanque) + "' AND UPPER(TP.Descripcion)=UPPER('Combustible')) THEN 1 ELSE 0 END",
                false);
        }

        internal List<VolumenTanqueDTO> Log(int CodDocumento)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodDocumento), MapVolumenTanqueLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, VolumenTanqueDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO VolumenTanque (CodDocumento,Fecha,CodTanque,Pies,Pulgadas,Dieciseisavos,Volumen,MedidaAguaPies,MedidaAguaPulgadas,VolumenAgua,CorreccionTecho,Temperatura,Api,Factor,VolumenAmbiente,VolumenEstandar,CapacidadMaxima,CapacidadDisponible,Version,Estatus,CodUsuarioCreacion,FechaCreacion,AccionLog)" +
                        "VALUES('"
                        + Obj.CodDocumento + "',"
                        + SqlFecha(Obj.Fecha) + ",N'"
                        + SqlTexto(Obj.CodTanque) + "','"
                        + Obj.Pies + "','"
                        + Obj.Pulgadas + "','"
                        + Obj.Dieciseisavos + "',"
                        + SqlNumero(Obj.Volumen) + ",'"
                        + Obj.MedidaAguaPies + "','"
                        + Obj.MedidaAguaPulgadas + "',"
                        + SqlNumero(Obj.VolumenAgua) + ","
                        + SqlNumero(Obj.CorreccionTecho) + ","
                        + SqlNumero(Obj.Temperatura) + ","
                        + SqlNumero(Obj.Api) + ","
                        + SqlNumero(Obj.Factor) + ","
                        + SqlNumero(Obj.VolumenAmbiente) + ","
                        + SqlNumero(Obj.VolumenEstandar) + ","
                        + SqlNumero(Obj.CapacidadMaxima) + ","
                        + SqlNumero(Obj.CapacidadDisponible) + ",'"
                        + Obj.Version + "','1',N'"
                        + SqlTexto(Obj.CodUsuarioCreacion) + "',GETDATE(),'C')";
                case TipoDAL.Editar:
                    return "UPDATE VolumenTanque SET "
                        + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                        + "CodTanque=N'" + SqlTexto(Obj.CodTanque) + "',"
                        + "Pies='" + Obj.Pies + "',"
                        + "Pulgadas='" + Obj.Pulgadas + "',"
                        + "Dieciseisavos='" + Obj.Dieciseisavos + "',"
                        + "Volumen=" + SqlNumero(Obj.Volumen) + ","
                        + "CorreccionTecho=" + SqlNumero(Obj.CorreccionTecho) + ","
                        + "MedidaAguaPies=" + Obj.MedidaAguaPies + ","
                        + "MedidaAguaPulgadas=" + Obj.MedidaAguaPulgadas + ","
                        + "VolumenAgua=" + SqlNumero(Obj.VolumenAgua) + ","
                        + "Temperatura=" + SqlNumero(Obj.Temperatura) + ","
                        + "Api=" + SqlNumero(Obj.Api) + ","
                        + "Factor=" + SqlNumero(Obj.Factor) + ","
                        + "VolumenAmbiente=" + SqlNumero(Obj.VolumenAmbiente) + ","
                        + "VolumenEstandar=" + SqlNumero(Obj.VolumenEstandar) + ","
                        + "CapacidadMaxima=" + SqlNumero(Obj.CapacidadMaxima) + ","
                        + "CapacidadDisponible=" + SqlNumero(Obj.CapacidadDisponible) + ","
                        + "Version=" + Obj.Version + ","
                        + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                        + "FechaActualizacion=GETDATE(),"
                        + "AccionLog='U' "
                        + "WHERE CodDocumento='" + Obj.CodDocumento + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM VolumenTanque WHERE CodDocumento='" + Obj.CodDocumento + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodDocumento],CONCAT(A.[CodDocumento], ' - ', ISNULL(T.[Tanque], ''), ' - ', CONVERT(VARCHAR(10), A.[Fecha], 103)) AS [Descripcion] "
                        + "FROM VolumenTanque A "
                        + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                        + "WHERE ISNULL(A.[Estatus], 1) = 1 ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodDocumento]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodDocumento]),0)+1 AS [CodDocumento] FROM VolumenTanque A ";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 AS [Version] FROM (SELECT * FROM VolumenTanque_LOG UNION ALL SELECT * FROM VolumenTanque) A "
                        + "WHERE A.[CodDocumento]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodDocumento],A.[Fecha],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],A.[Pies],A.[Pulgadas],A.[Dieciseisavos],A.[Volumen],A.[MedidaAguaPies],A.[MedidaAguaPulgadas],A.[VolumenAgua],A.[CorreccionTecho],A.[Temperatura],A.[Api],A.[Factor],A.[VolumenAmbiente],A.[VolumenEstandar],A.[CapacidadMaxima],A.[CapacidadDisponible],"
                        + "A.[Version],A.[Estatus],A.[CodUsuarioCreacion],A.[FechaCreacion],A.[CodUsuarioActualizacion],A.[FechaActualizacion],"
                        + "A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                        + "FROM (SELECT * FROM VolumenTanque_LOG UNION ALL SELECT * FROM VolumenTanque) A "
                        + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                        + "WHERE A.[CodDocumento] = '" + CodKey + "' "
                        + "ORDER BY A.[Version] ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodDocumento],A.[Fecha],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],A.[Pies],A.[Pulgadas],A.[Dieciseisavos],A.[Volumen],A.[MedidaAguaPies],A.[MedidaAguaPulgadas],A.[VolumenAgua],A.[CorreccionTecho],A.[Temperatura],A.[Api],A.[Factor],A.[VolumenAmbiente],A.[VolumenEstandar],A.[CapacidadMaxima],A.[CapacidadDisponible],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM VolumenTanque A "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] ";
        }

        private string QueryListado(PaginacionParametros paginacion, string CodTanque = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codDocumento"] = "A.[CodDocumento]",
                ["fecha"] = "A.[Fecha]",
                ["codTanque"] = "A.[CodTanque]",
                ["tanque"] = "T.[Tanque]",
                ["pies"] = "A.[Pies]",
                ["pulgadas"] = "A.[Pulgadas]",
                ["dieciseisavos"] = "A.[Dieciseisavos]",
                ["volumen"] = "A.[Volumen]",
                ["estatus"] = "A.[Estatus]"
            };

            CodTanque = (CodTanque ?? "").Trim();
            string where = "WHERE ISNULL(A.[Estatus], 1) = 1 "
                + (!string.IsNullOrWhiteSpace(CodTanque) ? "AND A.[CodTanque] = N'" + SqlTexto(CodTanque) + "' " : "")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodDocumento])",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "CONVERT(VARCHAR(20), A.[CodTanque])",
                    "T.[Tanque]",
                    "CONVERT(VARCHAR(20), A.[Pies])",
                    "CONVERT(VARCHAR(20), A.[Pulgadas])",
                    "CONVERT(VARCHAR(20), A.[Dieciseisavos])",
                    "CONVERT(VARCHAR(30), A.[Volumen])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[Fecha] DESC, A.[CodDocumento] DESC");

            return "SELECT A.[CodDocumento],A.[Fecha],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],A.[Pies],A.[Pulgadas],A.[Dieciseisavos],A.[Volumen],A.[MedidaAguaPies],A.[MedidaAguaPulgadas],A.[VolumenAgua],A.[CorreccionTecho],A.[Temperatura],A.[Api],A.[Factor],A.[VolumenAmbiente],A.[VolumenEstandar],A.[CapacidadMaxima],A.[CapacidadDisponible],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM VolumenTanque A "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private MsjDB PrepararVolumen(VolumenTanqueDTO Obj)
        {
            Obj.CodTanque = (Obj.CodTanque ?? "").Trim();
            decimal? volumen = ObtenerVolumen(Obj.CodTanque, Obj.Pies, Obj.Pulgadas, Obj.Dieciseisavos);

            if (!volumen.HasValue)
                return Error("No existe capacidad volumentrica vigente para la medicion ingresada.");

            Obj.Volumen = volumen.Value;
            Obj.VolumenAmbiente = decimal.Round(Obj.Volumen - Obj.VolumenAgua + Obj.CorreccionTecho, 4);
            Obj.VolumenEstandar = decimal.Round(Obj.VolumenAmbiente * Obj.Factor, 4);
            Obj.CapacidadMaxima = ObtenerCapacidadMaxima(Obj.CodTanque);
            Obj.CapacidadDisponible = decimal.Round(Obj.CapacidadMaxima - Obj.Volumen, 4);

            return Ok();
        }

        private void LimpiarCamposCombustible(VolumenTanqueDTO Obj)
        {
            Obj.CorreccionTecho = 0;
            Obj.MedidaAguaPies = 0;
            Obj.MedidaAguaPulgadas = 0;
            Obj.VolumenAgua = 0;
            Obj.Temperatura = 0;
            Obj.Api = 0;
            Obj.Factor = 0;
            Obj.VolumenAmbiente = 0;
            Obj.VolumenEstandar = 0;
            Obj.CapacidadMaxima = 0;
            Obj.CapacidadDisponible = 0;
        }

        private decimal ObtenerCapacidadMaxima(string codTanque)
        {
            return ObjDAL.EjecutarScalar(
                "SELECT ISNULL(VolumenMaximo, 0) FROM Tanque WHERE CodTanque=N'" + SqlTexto(codTanque) + "'",
                0m);
        }

        private decimal? ObtenerVolumen(string CodTanque, int Pies, int Pulgadas, int Dieciseisavos)
        {
            decimal? exacto = ObtenerVolumenExacto(CodTanque, Pies, Pulgadas, Dieciseisavos);
            if (exacto.HasValue)
                return exacto.Value;

            if (Dieciseisavos <= 0)
                return null;

            decimal? volumenBase = ObtenerVolumenExacto(CodTanque, Pies, Pulgadas, 0);
            int totalPulgadasSiguiente = (Pies * 12) + Pulgadas + 1;
            int piesSiguiente = totalPulgadasSiguiente / 12;
            int pulgadasSiguiente = totalPulgadasSiguiente % 12;
            decimal? volumenSiguiente = ObtenerVolumenExacto(CodTanque, piesSiguiente, pulgadasSiguiente, 0);

            if (!volumenBase.HasValue || !volumenSiguiente.HasValue)
                return null;

            decimal diferencia = volumenSiguiente.Value - volumenBase.Value;
            return decimal.Round(volumenBase.Value + (diferencia * Dieciseisavos / DenominadorFraccion), 4);
        }

        private decimal? ObtenerVolumenExacto(string CodTanque, int Pies, int Pulgadas, int Dieciseisavos)
        {
            List<decimal> volumen = ObjDAL.EjecutarReader(QueryVolumenExacto(CodTanque, Pies, Pulgadas, Dieciseisavos), reader => Convert.ToDecimal(reader["Volumen"]));
            return volumen.Count > 0 ? volumen[0] : null;
        }

        private string QueryVolumenExacto(string CodTanque, int Pies, int Pulgadas, int Dieciseisavos)
        {
            return "SELECT TOP 1 D.[Volumen] "
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

        private VolumenTanqueDTO MapVolumenTanque(SqlDataReader reader)
        {
            VolumenTanqueDTO Obj = new VolumenTanqueDTO();
            Obj.CodDocumento = Convert.ToInt32(reader["CodDocumento"]);
            Obj.IdVolumenTanque = ObjEncriptacion.Encriptar(Obj.CodDocumento.ToString());
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.CodTanque = reader["CodTanque"].ToString() ?? "";
            Obj.IdTanque = ObjEncriptacion.Encriptar(Obj.CodTanque);
            Obj.Tanque = reader["Tanque"].ToString() ?? "";
            Obj.Pies = Convert.ToInt32(reader["Pies"]);
            Obj.Pulgadas = Convert.ToInt32(reader["Pulgadas"]);
            Obj.Dieciseisavos = Convert.ToInt32(reader["Dieciseisavos"]);
            Obj.Volumen = Convert.ToDecimal(reader["Volumen"]);
            Obj.CorreccionTecho = Convert.ToDecimal(reader["CorreccionTecho"]);
            Obj.MedidaAguaPies = Convert.ToInt32(reader["MedidaAguaPies"]);
            Obj.MedidaAguaPulgadas = Convert.ToInt32(reader["MedidaAguaPulgadas"]);
            Obj.VolumenAgua = Convert.ToDecimal(reader["VolumenAgua"]);
            Obj.Temperatura = Convert.ToDecimal(reader["Temperatura"]);
            Obj.Api = Convert.ToDecimal(reader["Api"]);
            Obj.Factor = Convert.ToDecimal(reader["Factor"]);
            Obj.VolumenAmbiente = Convert.ToDecimal(reader["VolumenAmbiente"]);
            Obj.VolumenEstandar = Convert.ToDecimal(reader["VolumenEstandar"]);
            Obj.CapacidadMaxima = Convert.ToDecimal(reader["CapacidadMaxima"]);
            Obj.CapacidadDisponible = Convert.ToDecimal(reader["CapacidadDisponible"]);
            Obj.Estatus = Bool(reader["Estatus"]);
            return Obj;
        }

        private VolumenTanqueDTO MapVolumenTanqueLog(SqlDataReader reader)
        {
            VolumenTanqueDTO Obj = MapVolumenTanque(reader);
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

        private bool Bool(object valor)
        {
            if (valor == DBNull.Value)
                return false;

            return Convert.ToBoolean(valor);
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
