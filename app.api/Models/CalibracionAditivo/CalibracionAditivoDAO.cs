using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Globalization;

namespace app.Models.CalibracionAditivo
{
    /// <summary>
    /// DAO para el registro de calibraciones de aditivo.
    /// </summary>
    internal class CalibracionAditivoDAO
    {
        private DAL ObjDAL = new DAL();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<CalibracionAditivoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<CalibracionAditivoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapCalibracion(reader);
            });

            return new PaginacionResultado<CalibracionAditivoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> ListarProductosAditivo()
        {
            return ObjDAL.EjecutarReader(QueryListarProductosAditivo(), reader => new SelectListItem()
            {
                Text = reader["Producto"].ToString(),
                Value = reader["CodProducto"].ToString()
            });
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(CalibracionAditivoDTO Obj)
        {
            Obj.CodCalibracionAditivo = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararCalibracion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CalibracionAditivo", "CREADO", "CodCalibracionAditivo:" + Obj.CodCalibracionAditivo, Nuevo: Obj);
            }

            return msjDB;
        }

        internal CalibracionAditivoDTO Obtener(int CodCalibracionAditivo)
        {
            return ObjDAL.EjecutarReader(QueryObtener(CodCalibracionAditivo), MapCalibracion).FirstOrDefault()
                ?? new CalibracionAditivoDTO();
        }

        internal MsjDB Editar(CalibracionAditivoDTO Obj)
        {
            CalibracionAditivoDTO ObjAnterior = Obtener(Obj.CodCalibracionAditivo);
            Obj.Version = ObtenerVersion(Obj.CodCalibracionAditivo);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararCalibracion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(QueryEditar(Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CalibracionAditivo", "EDITADO", "CodCalibracionAditivo:" + Obj.CodCalibracionAditivo, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Eliminar(CalibracionAditivoDTO Obj)
        {
            CalibracionAditivoDTO ObjAnterior = Obtener(Obj.CodCalibracionAditivo);
            MsjDB msjDB = ObjDAL.Ejecutar("DELETE FROM CalibracionAditivo WHERE CodCalibracionAditivo='" + Obj.CodCalibracionAditivo + "'", Key: false, tipoDAL: TipoDAL.Eliminar);

            if (msjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CalibracionAditivo", "ELIMINADO", "CodCalibracionAditivo:" + Obj.CodCalibracionAditivo, Anterior: ObjAnterior);
            }

            return msjDB;
        }

        internal List<CalibracionAditivoDTO> Log(int CodCalibracionAditivo)
        {
            return ObjDAL.EjecutarReader(QueryLog(CodCalibracionAditivo), MapCalibracionLog);
        }

        internal int ObtenerVersion(int CodCalibracionAditivo)
        {
            return ObjDAL.EjecutarScalar(
                "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' "
                + "FROM (SELECT [CodCalibracionAditivo],[Version] FROM CalibracionAditivo_LOG UNION ALL SELECT [CodCalibracionAditivo],[Version] FROM CalibracionAditivo) A "
                + "WHERE A.[CodCalibracionAditivo]='" + CodCalibracionAditivo + "'", 1);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, CalibracionAditivoDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO CalibracionAditivo (CodCalibracionAditivo,Fecha,CodBahia,CodProducto,CodPersonal,CodCompaniaInspeccion,FechaCalibracion,ProximaFecha,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj!.CodCalibracionAditivo + "',"
                            + SqlFecha(Obj.Fecha) + ",'"
                            + SqlTexto(Obj.CodBahia) + "','"
                            + Obj.CodProducto + "',"
                            + SqlIntNullable(Obj.CodPersonal) + ","
                            + SqlIntNullable(Obj.CodCompaniaInspeccion) + ","
                            + SqlFecha(Obj.FechaCalibracion) + ","
                            + SqlFecha(Obj.ProximaFecha) + ",'"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodCalibracionAditivo]),0)+1 as 'CodCalibracionAditivo' FROM CalibracionAditivo A ";
                default:
                    return "";
            }
        }

        private MsjDB PrepararCalibracion(CalibracionAditivoDTO Obj)
        {
            if (!Obj.Fecha.HasValue)
                return Error("La fecha es requerida.");

            Obj.CodBahia = (Obj.CodBahia ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodBahia))
                return Error("La bahia es requerida.");

            if (Obj.CodBahia.Length > 20)
                return Error("El codigo de bahia debe tener maximo 20 caracteres.");

            if (Obj.CodProducto <= 0)
                return Error("El producto es requerido.");

            if (Obj.CodPersonal <= 0)
                return Error("El tecnico es requerido.");

            if (Obj.CodCompaniaInspeccion <= 0)
                return Error("La compania de inspeccion es requerida.");

            if (!Obj.FechaCalibracion.HasValue)
                return Error("La fecha de calibracion es requerida.");

            if (!BahiaExiste(Obj.CodBahia))
                return Error("La bahia seleccionada no existe.");

            if (!ProductoEsAditivo(Obj.CodProducto))
                return Error("El producto seleccionado debe ser de tipo aditivo.");

            if (!PersonalEsTecnico(Obj.CodPersonal))
                return Error("El personal seleccionado debe ser tecnico.");

            if (!CompaniaInspeccionExiste(Obj.CodCompaniaInspeccion))
                return Error("La compania de inspeccion seleccionada no existe.");

            Obj.Fecha = Obj.Fecha.Value.Date;
            Obj.FechaCalibracion = Obj.FechaCalibracion.Value.Date;
            Obj.ProximaFecha = Obj.FechaCalibracion.Value.AddDays(120);

            return Ok();
        }

        private bool BahiaExiste(string CodBahia)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Bahia A WHERE A.[CodBahia]=N'" + SqlTexto(CodBahia) + "'");
        }

        private bool ProductoEsAditivo(int CodProducto)
        {
            return ObjDAL.EjecutarExiste(QueryProductoAditivo(CodProducto));
        }

        private bool PersonalEsTecnico(int CodPersonal)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Personal A WHERE A.[CodPersonal]='" + CodPersonal + "' AND ISNULL(A.[EsTecnico], 0)=1 AND ISNULL(A.[Estatus], 1)=1");
        }

        private bool CompaniaInspeccionExiste(int CodCompaniaInspeccion)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM CompaniaInspeccion A WHERE A.[CodCompaniaInspeccion]='" + CodCompaniaInspeccion + "' AND ISNULL(A.[Estatus], 1)=1");
        }

        private string QueryListarProductosAditivo()
        {
            return "SELECT A.[CodProducto],A.[Producto] "
                + "FROM Producto A "
                + "INNER JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE UPPER(TP.[Descripcion]) = UPPER('Aditivo') "
                + "ORDER BY A.[Producto]";
        }

        private string QueryProductoAditivo(int CodProducto)
        {
            return "SELECT 1 "
                + "FROM Producto P "
                + "INNER JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE P.[CodProducto] = '" + CodProducto + "' "
                + "AND UPPER(TP.[Descripcion]) = UPPER('Aditivo')";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codCalibracionAditivo"] = "A.[CodCalibracionAditivo]",
                ["fecha"] = "A.[Fecha]",
                ["bahia"] = "B.[Bahia]",
                ["producto"] = "P.[Producto]",
                ["personal"] = "PE.[Nombre]",
                ["companiaInspeccion"] = "CI.[NombreComercial]",
                ["fechaCalibracion"] = "A.[FechaCalibracion]",
                ["proximaFecha"] = "A.[ProximaFecha]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodCalibracionAditivo])",
                    "CONVERT(VARCHAR(10), A.[Fecha], 103)",
                    "CONVERT(VARCHAR(10), A.[Fecha], 120)",
                    "B.[Bahia]",
                    "P.[Producto]",
                    "PE.[Nombre]",
                    "CI.[NombreComercial]",
                    "CONVERT(VARCHAR(10), A.[FechaCalibracion], 103)",
                    "CONVERT(VARCHAR(10), A.[FechaCalibracion], 120)",
                    "CONVERT(VARCHAR(10), A.[ProximaFecha], 103)",
                    "CONVERT(VARCHAR(10), A.[ProximaFecha], 120)",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodCalibracionAditivo] ASC");

            return "SELECT A.[CodCalibracionAditivo],A.[Fecha],A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "ISNULL(A.[CodPersonal], 0) AS [CodPersonal],ISNULL(PE.[Nombre], '') AS [Personal],"
                + "ISNULL(A.[CodCompaniaInspeccion], 0) AS [CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[FechaCalibracion],A.[ProximaFecha],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM CalibracionAditivo A "
                + "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN Personal PE ON A.[CodPersonal] = PE.[CodPersonal] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryObtener(int CodCalibracionAditivo)
        {
            return "SELECT A.[CodCalibracionAditivo],A.[Fecha],A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "ISNULL(A.[CodPersonal], 0) AS [CodPersonal],ISNULL(PE.[Nombre], '') AS [Personal],"
                + "ISNULL(A.[CodCompaniaInspeccion], 0) AS [CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[FechaCalibracion],A.[ProximaFecha],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM CalibracionAditivo A "
                + "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN Personal PE ON A.[CodPersonal] = PE.[CodPersonal] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] "
                + "WHERE A.[CodCalibracionAditivo]='" + CodCalibracionAditivo + "'";
        }

        private string QueryEditar(CalibracionAditivoDTO Obj)
        {
            return "UPDATE CalibracionAditivo SET "
                + "Fecha=" + SqlFecha(Obj.Fecha) + ","
                + "CodBahia=N'" + SqlTexto(Obj.CodBahia) + "',"
                + "CodProducto='" + Obj.CodProducto + "',"
                + "CodPersonal=" + SqlIntNullable(Obj.CodPersonal) + ","
                + "CodCompaniaInspeccion=" + SqlIntNullable(Obj.CodCompaniaInspeccion) + ","
                + "FechaCalibracion=" + SqlFecha(Obj.FechaCalibracion) + ","
                + "ProximaFecha=" + SqlFecha(Obj.ProximaFecha) + ","
                + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                + "Version='" + Obj.Version + "',"
                + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                + "FechaActualizacion=GETDATE() "
                + "WHERE CodCalibracionAditivo='" + Obj.CodCalibracionAditivo + "'";
        }

        private string QueryLog(int CodCalibracionAditivo)
        {
            return "SELECT A.[CodCalibracionAditivo],A.[Fecha],A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "ISNULL(A.[CodPersonal], 0) AS [CodPersonal],ISNULL(PE.[Nombre], '') AS [Personal],"
                + "ISNULL(A.[CodCompaniaInspeccion], 0) AS [CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[FechaCalibracion],A.[ProximaFecha],ISNULL(A.[Estatus], 1) AS [Estatus],A.[Version],"
                + "A.[CodUsuarioCreacion],A.[FechaCreacion],A.[CodUsuarioActualizacion],A.[FechaActualizacion],"
                + "A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                + "FROM (SELECT * FROM CalibracionAditivo_LOG UNION ALL SELECT * FROM CalibracionAditivo) A "
                + "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN Personal PE ON A.[CodPersonal] = PE.[CodPersonal] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] "
                + "WHERE A.[CodCalibracionAditivo]='" + CodCalibracionAditivo + "' "
                + "ORDER BY A.[Version]";
        }

        private CalibracionAditivoDTO MapCalibracion(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            CalibracionAditivoDTO Obj = new CalibracionAditivoDTO();
            Obj.CodCalibracionAditivo = Int(reader["CodCalibracionAditivo"]);
            Obj.IdCalibracionAditivo = ObjEncriptacion.Encriptar(Obj.CodCalibracionAditivo.ToString());
            Obj.Fecha = Fecha(reader["Fecha"]);
            Obj.CodBahia = reader["CodBahia"].ToString() ?? "";
            Obj.IdBahia = ObjEncriptacion.Encriptar(Obj.CodBahia);
            Obj.Bahia = reader["Bahia"].ToString() ?? "";
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
            Obj.FechaCalibracion = Fecha(reader["FechaCalibracion"]);
            Obj.ProximaFecha = Fecha(reader["ProximaFecha"]);
            Obj.Estatus = Bool(reader["Estatus"], true);
            return Obj;
        }

        private CalibracionAditivoDTO MapCalibracionLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            CalibracionAditivoDTO Obj = MapCalibracion(reader);
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

        private string SqlFecha(DateTime? valor)
        {
            if (!valor.HasValue)
                return "NULL";

            return "'" + valor.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture) + "'";
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

        private DateTime? Fecha(object valor)
        {
            if (valor == DBNull.Value)
                return null;

            if (DateTime.TryParse(valor.ToString(), out DateTime fecha))
                return fecha;

            return null;
        }

        private bool Bool(object valor, bool valorPorDefecto = false)
        {
            if (valor == DBNull.Value)
                return valorPorDefecto;

            return Convert.ToBoolean(valor);
        }
    }
}


