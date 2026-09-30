using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Globalization;

namespace app.Models.CalibracionEtanol
{
    /// <summary>
    /// DAO para el registro de calibraciones de etanol.
    /// </summary>
    internal class CalibracionEtanolDAO
    {
        private DAL ObjDAL = new DAL();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<CalibracionEtanolDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<CalibracionEtanolDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapCalibracion(reader);
            });

            return new PaginacionResultado<CalibracionEtanolDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> ListarBrazos(string CodBahia = "")
        {
            return ObjDAL.EjecutarReader(QueryListarBrazos(CodBahia), reader => new SelectListItem()
            {
                Text = reader["Brazo"].ToString(),
                Value = reader["CodBrazo"].ToString()
            });
        }

        internal List<SelectListItem> ListarProductosEtanol()
        {
            return ObjDAL.EjecutarReader(QueryListarProductosEtanol(), reader => new SelectListItem()
            {
                Text = reader["Producto"].ToString(),
                Value = reader["CodProducto"].ToString()
            });
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(CalibracionEtanolDTO Obj)
        {
            Obj.CodCalibracionEtanol = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararCalibracion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CalibracionEtanol", "CREADO", "CodCalibracionEtanol:" + Obj.CodCalibracionEtanol, Nuevo: Obj);
            }

            return msjDB;
        }

        internal CalibracionEtanolDTO Obtener(int CodCalibracionEtanol)
        {
            return ObjDAL.EjecutarReader(QueryObtener(CodCalibracionEtanol), MapCalibracion).FirstOrDefault()
                ?? new CalibracionEtanolDTO();
        }

        internal MsjDB Editar(CalibracionEtanolDTO Obj)
        {
            CalibracionEtanolDTO ObjAnterior = Obtener(Obj.CodCalibracionEtanol);
            Obj.Version = ObtenerVersion(Obj.CodCalibracionEtanol);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararCalibracion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(QueryEditar(Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CalibracionEtanol", "EDITADO", "CodCalibracionEtanol:" + Obj.CodCalibracionEtanol, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Eliminar(CalibracionEtanolDTO Obj)
        {
            CalibracionEtanolDTO ObjAnterior = Obtener(Obj.CodCalibracionEtanol);
            MsjDB msjDB = ObjDAL.Ejecutar("DELETE FROM CalibracionEtanol WHERE CodCalibracionEtanol='" + Obj.CodCalibracionEtanol + "'", Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CalibracionEtanol", "ELIMINADO", "CodCalibracionEtanol:" + Obj.CodCalibracionEtanol, Anterior: ObjAnterior);
            }

            return msjDB;
        }

        internal List<CalibracionEtanolDTO> Log(int CodCalibracionEtanol)
        {
            return ObjDAL.EjecutarReader(QueryLog(CodCalibracionEtanol), MapCalibracionLog);
        }

        internal int ObtenerVersion(int CodCalibracionEtanol)
        {
            return ObjDAL.EjecutarScalar(
                "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' "
                + "FROM (SELECT [CodCalibracionEtanol],[Version] FROM CalibracionEtanol_LOG UNION ALL SELECT [CodCalibracionEtanol],[Version] FROM CalibracionEtanol) A "
                + "WHERE A.[CodCalibracionEtanol]='" + CodCalibracionEtanol + "'", 1);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, CalibracionEtanolDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO CalibracionEtanol (CodCalibracionEtanol,Fecha,ProximaFecha,CodBahia,CodBrazo,CodProducto,CodPersonal,CodCompaniaInspeccion,CantidadCalibracion,HoraInicio,HoraFinal,TiempoTotal,FactorCalibracion,PorcentajeDesviacion,VolumenBrutoFinalDespuesCalibrar,VolumenFinalCalibracionAnterior,VolumenEncontradoInicialCalibracion,ProximoVolumenACalibrar,VolumenDespachado,Comentarios,TemperaturaRack,TemperaturaSerafin,DiferenciaTemperaturas,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj!.CodCalibracionEtanol + "',"
                            + SqlFecha(Obj.Fecha) + ","
                            + SqlFecha(Obj.ProximaFecha) + ",'"
                            + SqlTexto(Obj.CodBahia) + "','"
                            + SqlTexto(Obj.CodBrazo) + "','"
                            + Obj.CodProducto + "',"
                            + SqlIntNullable(Obj.CodPersonal) + ","
                            + SqlIntNullable(Obj.CodCompaniaInspeccion) + ","
                            + SqlNumero(Obj.CantidadCalibracion) + ","
                            + SqlHora(Obj.HoraInicio) + ","
                            + SqlHora(Obj.HoraFinal) + ","
                            + SqlNumero(Obj.TiempoTotal) + ","
                            + SqlNumero(Obj.FactorCalibracion) + ","
                            + SqlNumero(Obj.PorcentajeDesviacion) + ","
                            + SqlNumero(Obj.VolumenBrutoFinalDespuesCalibrar) + ","
                            + SqlNumero(Obj.VolumenFinalCalibracionAnterior) + ","
                            + SqlNumero(Obj.VolumenEncontradoInicialCalibracion) + ","
                            + SqlNumero(Obj.ProximoVolumenACalibrar) + ","
                            + SqlNumero(Obj.VolumenDespachado) + ","
                            + SqlTextoSql(Obj.Comentarios) + ","
                            + SqlNumero(Obj.TemperaturaRack) + ","
                            + SqlNumero(Obj.TemperaturaSerafin) + ","
                            + SqlNumero(Obj.DiferenciaTemperaturas) + ",'"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodCalibracionEtanol]),0)+1 as 'CodCalibracionEtanol' FROM CalibracionEtanol A ";
                default:
                    return "";
            }
        }

        private MsjDB PrepararCalibracion(CalibracionEtanolDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return Error("La fecha de calibracion es requerida.");

            Obj.CodBahia = (Obj.CodBahia ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodBahia))
                return Error("La bahia es requerida.");

            if (Obj.CodBahia.Length > 20)
                return Error("El codigo de bahia debe tener maximo 20 caracteres.");

            Obj.CodBrazo = (Obj.CodBrazo ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodBrazo))
                return Error("El brazo es requerido.");

            if (Obj.CodBrazo.Length > 20)
                return Error("El codigo de brazo debe tener maximo 20 caracteres.");

            if (Obj.CodProducto <= 0)
                return Error("El producto es requerido.");

            if (Obj.CodPersonal <= 0)
                return Error("El tecnico es requerido.");

            if (Obj.CodCompaniaInspeccion <= 0)
                return Error("La compania de inspeccion es requerida.");

            if (Obj.CantidadCalibracion <= 0)
                return Error("La cantidad de la calibracion debe ser mayor a cero.");

            if (!BahiaExiste(Obj.CodBahia))
                return Error("La bahia seleccionada no existe.");

            if (!BrazoPerteneceABahia(Obj.CodBrazo, Obj.CodBahia))
                return Error("El brazo seleccionado no pertenece a la bahia.");

            if (!ProductoEsEtanol(Obj.CodProducto))
                return Error("El producto seleccionado debe ser de tipo etanol.");

            if (!PersonalEsTecnico(Obj.CodPersonal))
                return Error("El personal seleccionado debe ser tecnico.");

            if (!CompaniaInspeccionExiste(Obj.CodCompaniaInspeccion))
                return Error("La compania de inspeccion seleccionada no existe.");

            Obj.Fecha = Obj.Fecha.Value.Date;
            Obj.ProximaFecha = Obj.Fecha.Value.AddDays(75);

            if (!NormalizarHora(Obj.HoraInicio, out string? horaInicio))
                return Error("La hora de inicio no tiene un formato valido.");

            if (!NormalizarHora(Obj.HoraFinal, out string? horaFinal))
                return Error("La hora final no tiene un formato valido.");

            Obj.HoraInicio = horaInicio;
            Obj.HoraFinal = horaFinal;
            Obj.TiempoTotal = CalcularTiempoTotal(horaInicio, horaFinal);
            Obj.DiferenciaTemperaturas = CalcularDiferenciaTemperaturas(Obj.TemperaturaRack, Obj.TemperaturaSerafin);

            return Ok();
        }

        private bool BahiaExiste(string CodBahia)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Bahia A WHERE A.[CodBahia]=N'" + SqlTexto(CodBahia) + "'");
        }

        private bool BrazoPerteneceABahia(string CodBrazo, string CodBahia)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Brazo A WHERE A.[CodBrazo]=N'" + SqlTexto(CodBrazo) + "' AND A.[CodBahia]=N'" + SqlTexto(CodBahia) + "'");
        }

        private bool ProductoEsEtanol(int CodProducto)
        {
            return ObjDAL.EjecutarExiste(QueryProductoEtanol(CodProducto));
        }

        private bool PersonalEsTecnico(int CodPersonal)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Personal A WHERE A.[CodPersonal]='" + CodPersonal + "' AND ISNULL(A.[EsTecnico], 0)=1 AND ISNULL(A.[Estatus], 1)=1");
        }

        private bool CompaniaInspeccionExiste(int CodCompaniaInspeccion)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM CompaniaInspeccion A WHERE A.[CodCompaniaInspeccion]='" + CodCompaniaInspeccion + "' AND ISNULL(A.[Estatus], 1)=1");
        }

        private string QueryListarBrazos(string CodBahia)
        {
            string filtroBahia = !string.IsNullOrWhiteSpace(CodBahia) ? "WHERE A.[CodBahia]=N'" + SqlTexto(CodBahia.Trim()) + "' " : "";
            return "SELECT A.[CodBrazo],A.[Brazo] FROM Brazo A " + filtroBahia + "ORDER BY A.[Brazo]";
        }

        private string QueryListarProductosEtanol()
        {
            return "SELECT A.[CodProducto],A.[Producto] "
                + "FROM Producto A "
                + "INNER JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE UPPER(TP.[Descripcion]) = UPPER('Etanol') "
                + "ORDER BY A.[Producto]";
        }

        private string QueryProductoEtanol(int CodProducto)
        {
            return "SELECT 1 "
                + "FROM Producto P "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE P.[CodProducto] = '" + CodProducto + "' "
                + "AND UPPER(TP.[Descripcion]) = UPPER('Etanol')";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codCalibracionEtanol"] = "A.[CodCalibracionEtanol]",
                ["fecha"] = "A.[Fecha]",
                ["proximaFecha"] = "A.[ProximaFecha]",
                ["bahia"] = "B.[Bahia]",
                ["brazo"] = "BR.[Brazo]",
                ["producto"] = "P.[Producto]",
                ["personal"] = "PE.[Nombre]",
                ["companiaInspeccion"] = "CI.[NombreComercial]",
                ["cantidadCalibracion"] = "A.[CantidadCalibracion]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodCalibracionEtanol])",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "CONVERT(VARCHAR(10), A.[Fecha], 120)",
                    "CONVERT(VARCHAR(10), A.[ProximaFecha], 103)",
                    "CONVERT(VARCHAR(10), A.[ProximaFecha], 120)",
                    "B.[Bahia]",
                    "BR.[Brazo]",
                    "P.[Producto]",
                    "PE.[Nombre]",
                    "CI.[NombreComercial]",
                    "CONVERT(VARCHAR(30), A.[CantidadCalibracion])",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodCalibracionEtanol] ASC");

            return SelectListadoBase()
                + ", COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM CalibracionEtanol A "
                + JoinListadoBase()
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryObtener(int CodCalibracionEtanol)
        {
            return SelectListadoBase()
                + " FROM CalibracionEtanol A "
                + JoinListadoBase()
                + "WHERE A.[CodCalibracionEtanol]='" + CodCalibracionEtanol + "'";
        }

        private string QueryEditar(CalibracionEtanolDTO Obj)
        {
            return "UPDATE CalibracionEtanol SET "
                + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                + "ProximaFecha=" + SqlFecha(Obj.ProximaFecha) + ","
                + "CodBahia=N'" + SqlTexto(Obj.CodBahia) + "',"
                + "CodBrazo=N'" + SqlTexto(Obj.CodBrazo) + "',"
                + "CodProducto='" + Obj.CodProducto + "',"
                + "CodPersonal=" + SqlIntNullable(Obj.CodPersonal) + ","
                + "CodCompaniaInspeccion=" + SqlIntNullable(Obj.CodCompaniaInspeccion) + ","
                + "CantidadCalibracion=" + SqlNumero(Obj.CantidadCalibracion) + ","
                + "HoraInicio=" + SqlHora(Obj.HoraInicio) + ","
                + "HoraFinal=" + SqlHora(Obj.HoraFinal) + ","
                + "TiempoTotal=" + SqlNumero(Obj.TiempoTotal) + ","
                + "FactorCalibracion=" + SqlNumero(Obj.FactorCalibracion) + ","
                + "PorcentajeDesviacion=" + SqlNumero(Obj.PorcentajeDesviacion) + ","
                + "VolumenBrutoFinalDespuesCalibrar=" + SqlNumero(Obj.VolumenBrutoFinalDespuesCalibrar) + ","
                + "VolumenFinalCalibracionAnterior=" + SqlNumero(Obj.VolumenFinalCalibracionAnterior) + ","
                + "VolumenEncontradoInicialCalibracion=" + SqlNumero(Obj.VolumenEncontradoInicialCalibracion) + ","
                + "ProximoVolumenACalibrar=" + SqlNumero(Obj.ProximoVolumenACalibrar) + ","
                + "VolumenDespachado=" + SqlNumero(Obj.VolumenDespachado) + ","
                + "Comentarios=" + SqlTextoSql(Obj.Comentarios) + ","
                + "TemperaturaRack=" + SqlNumero(Obj.TemperaturaRack) + ","
                + "TemperaturaSerafin=" + SqlNumero(Obj.TemperaturaSerafin) + ","
                + "DiferenciaTemperaturas=" + SqlNumero(Obj.DiferenciaTemperaturas) + ","
                + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                + "Version='" + Obj.Version + "',"
                + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                + "FechaActualizacion=GETDATE() "
                + "WHERE CodCalibracionEtanol='" + Obj.CodCalibracionEtanol + "'";
        }

        private string QueryLog(int CodCalibracionEtanol)
        {
            return SelectLogBase()
                + "FROM (" + SelectUnionLog("CalibracionEtanol_LOG") + " UNION ALL " + SelectUnionLog("CalibracionEtanol") + ") A "
                + JoinListadoBase()
                + "WHERE A.[CodCalibracionEtanol] = '" + CodCalibracionEtanol + "' "
                + "ORDER BY A.[Version]";
        }

        private string SelectListadoBase()
        {
            return "SELECT A.[CodCalibracionEtanol],A.[Fecha],A.[ProximaFecha],"
                + "A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[CodBrazo],ISNULL(BR.[Brazo], '') AS [Brazo],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "ISNULL(A.[CodPersonal], 0) AS [CodPersonal],ISNULL(PE.[Nombre], '') AS [Personal],"
                + "ISNULL(A.[CodCompaniaInspeccion], 0) AS [CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[CantidadCalibracion],A.[HoraInicio],A.[HoraFinal],A.[TiempoTotal],A.[FactorCalibracion],"
                + "A.[PorcentajeDesviacion],A.[VolumenBrutoFinalDespuesCalibrar],A.[VolumenFinalCalibracionAnterior],"
                + "A.[VolumenEncontradoInicialCalibracion],A.[ProximoVolumenACalibrar],A.[VolumenDespachado],"
                + "A.[Comentarios],A.[TemperaturaRack],A.[TemperaturaSerafin],A.[DiferenciaTemperaturas],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus]";
        }

        private string JoinListadoBase()
        {
            return "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                + "LEFT JOIN Brazo BR ON A.[CodBrazo] = BR.[CodBrazo] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN Personal PE ON A.[CodPersonal] = PE.[CodPersonal] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] ";
        }

        private string SelectLogBase()
        {
            return SelectListadoBase()
                + ",A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] ";
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodCalibracionEtanol],[Fecha],[ProximaFecha],[CodBahia],[CodBrazo],[CodProducto],"
                + "[CodPersonal],[CodCompaniaInspeccion],[CantidadCalibracion],[HoraInicio],[HoraFinal],[TiempoTotal],"
                + "[FactorCalibracion],[PorcentajeDesviacion],[VolumenBrutoFinalDespuesCalibrar],"
                + "[VolumenFinalCalibracionAnterior],[VolumenEncontradoInicialCalibracion],[ProximoVolumenACalibrar],"
                + "[VolumenDespachado],[Comentarios],[TemperaturaRack],[TemperaturaSerafin],[DiferenciaTemperaturas],"
                + "[Estatus],[Version],[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],"
                + "[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog] FROM " + tabla;
        }

        private CalibracionEtanolDTO MapCalibracion(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            CalibracionEtanolDTO Obj = new CalibracionEtanolDTO();
            Obj.CodCalibracionEtanol = Int(reader["CodCalibracionEtanol"]);
            Obj.IdCalibracionEtanol = ObjEncriptacion.Encriptar(Obj.CodCalibracionEtanol.ToString());
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.ProximaFecha = Fecha(reader["ProximaFecha"]);
            Obj.CodBahia = reader["CodBahia"].ToString() ?? "";
            Obj.IdBahia = ObjEncriptacion.Encriptar(Obj.CodBahia);
            Obj.Bahia = reader["Bahia"].ToString() ?? "";
            Obj.CodBrazo = reader["CodBrazo"].ToString() ?? "";
            Obj.IdBrazo = ObjEncriptacion.Encriptar(Obj.CodBrazo);
            Obj.Brazo = reader["Brazo"].ToString() ?? "";
            Obj.CodProducto = Int(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CodPersonal = Int(reader["CodPersonal"]);

            if (Obj.CodPersonal > 0)
                Obj.IdPersonal = ObjEncriptacion.Encriptar(Obj.CodPersonal.ToString());

            Obj.Personal = reader["Personal"].ToString() ?? "";
            Obj.CodCompaniaInspeccion = Int(reader["CodCompaniaInspeccion"]);

            if (Obj.CodCompaniaInspeccion > 0)
                Obj.IdCompaniaInspeccion = ObjEncriptacion.Encriptar(Obj.CodCompaniaInspeccion.ToString());

            Obj.CompaniaInspeccion = reader["CompaniaInspeccion"].ToString() ?? "";
            Obj.CantidadCalibracion = DecimalValor(reader["CantidadCalibracion"]);
            Obj.HoraInicio = Hora(reader["HoraInicio"]);
            Obj.HoraFinal = Hora(reader["HoraFinal"]);
            Obj.TiempoTotal = IntNullable(reader["TiempoTotal"]);
            Obj.FactorCalibracion = DecimalNullable(reader["FactorCalibracion"]);
            Obj.PorcentajeDesviacion = DecimalNullable(reader["PorcentajeDesviacion"]);
            Obj.VolumenBrutoFinalDespuesCalibrar = DecimalNullable(reader["VolumenBrutoFinalDespuesCalibrar"]);
            Obj.VolumenFinalCalibracionAnterior = DecimalNullable(reader["VolumenFinalCalibracionAnterior"]);
            Obj.VolumenEncontradoInicialCalibracion = DecimalNullable(reader["VolumenEncontradoInicialCalibracion"]);
            Obj.ProximoVolumenACalibrar = DecimalNullable(reader["ProximoVolumenACalibrar"]);
            Obj.VolumenDespachado = DecimalNullable(reader["VolumenDespachado"]);
            Obj.Comentarios = reader["Comentarios"].ToString() ?? "";
            Obj.TemperaturaRack = DecimalNullable(reader["TemperaturaRack"]);
            Obj.TemperaturaSerafin = DecimalNullable(reader["TemperaturaSerafin"]);
            Obj.DiferenciaTemperaturas = DecimalNullable(reader["DiferenciaTemperaturas"]);
            Obj.Estatus = Bool(reader["Estatus"], true);
            return Obj;
        }

        private CalibracionEtanolDTO MapCalibracionLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            CalibracionEtanolDTO Obj = MapCalibracion(reader);
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);
            return Obj;
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

        private string SqlTextoSql(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return "NULL";

            return "N'" + SqlTexto(valor.Trim()) + "'";
        }

        private string SqlHora(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return "NULL";

            return "'" + SqlTexto(valor) + "'";
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

        private string SqlNumero(decimal? valor)
        {
            return valor.HasValue ? valor.Value.ToString(CultureInfo.InvariantCulture) : "NULL";
        }

        private string SqlNumero(int? valor)
        {
            return valor.HasValue ? valor.Value.ToString(CultureInfo.InvariantCulture) : "NULL";
        }

        private string SqlIntNullable(int valor)
        {
            return valor > 0 ? "'" + valor + "'" : "NULL";
        }

        private int Int(object valor)
        {
            if (valor == DBNull.Value)
                return 0;

            return Convert.ToInt32(valor);
        }

        private int? IntNullable(object valor)
        {
            if (valor == DBNull.Value)
                return null;

            return Convert.ToInt32(valor);
        }

        private decimal DecimalValor(object valor)
        {
            if (valor == DBNull.Value)
                return 0m;

            return Convert.ToDecimal(valor);
        }

        private decimal? DecimalNullable(object valor)
        {
            if (valor == DBNull.Value)
                return null;

            return Convert.ToDecimal(valor);
        }

        private DateTime? Fecha(object valor)
        {
            if (valor == DBNull.Value)
                return null;

            if (DateTime.TryParse(valor.ToString(), out DateTime fecha))
                return fecha;

            return null;
        }

        private string? Hora(object valor)
        {
            if (valor == DBNull.Value)
                return null;

            if (valor is TimeSpan tiempo)
                return tiempo.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture);

            return valor.ToString();
        }

        private bool Bool(object valor, bool valorPorDefecto = false)
        {
            if (valor == DBNull.Value)
                return valorPorDefecto;

            return Convert.ToBoolean(valor);
        }

        private bool NormalizarHora(string? valor, out string? hora)
        {
            hora = null;

            if (string.IsNullOrWhiteSpace(valor))
                return true;

            if (!TryParseHora(valor, out TimeSpan tiempo))
                return false;

            hora = tiempo.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture);
            return true;
        }

        private bool TryParseHora(string valor, out TimeSpan tiempo)
        {
            string[] formatos = { @"h\:mm", @"hh\:mm", @"h\:mm\:ss", @"hh\:mm\:ss" };
            return TimeSpan.TryParseExact(valor.Trim(), formatos, CultureInfo.InvariantCulture, out tiempo);
        }

        private int? CalcularTiempoTotal(string? horaInicio, string? horaFinal)
        {
            if (string.IsNullOrWhiteSpace(horaInicio) || string.IsNullOrWhiteSpace(horaFinal))
                return null;

            if (!TryParseHora(horaInicio, out TimeSpan inicio) || !TryParseHora(horaFinal, out TimeSpan final))
                return null;

            TimeSpan total = final - inicio;
            if (total.TotalMinutes < 0)
                total = total.Add(TimeSpan.FromDays(1));

            return Convert.ToInt32(Math.Round(total.TotalMinutes, MidpointRounding.AwayFromZero));
        }

        private decimal? CalcularDiferenciaTemperaturas(decimal? temperaturaRack, decimal? temperaturaSerafin)
        {
            if (!temperaturaRack.HasValue || !temperaturaSerafin.HasValue)
                return null;

            return temperaturaRack.Value - temperaturaSerafin.Value;
        }
    }
}


