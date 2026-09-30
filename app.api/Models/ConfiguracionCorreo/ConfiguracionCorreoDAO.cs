using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace app.Models.ConfiguracionCorreo
{
    /// <summary>
    /// Acceso a datos para la configuracion de correo.
    /// </summary>
    internal class ConfiguracionCorreoDAO
    {
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<ConfiguracionCorreoDTO> Listado(
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<ConfiguracionCorreoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapConfiguracionCorreo(reader);
            });

            return new PaginacionResultado<ConfiguracionCorreoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodConfiguracionCorreo"].ToString()
            });
        }

        internal ConfiguracionCorreoDTO Obtener(int CodConfiguracionCorreo)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodConfiguracionCorreo), MapConfiguracionCorreo).FirstOrDefault()
                ?? new ConfiguracionCorreoDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(ConfiguracionCorreoDTO Obj)
        {
            if (ExisteConfiguracion())
                return Error("Solo se permite una configuracion de correo. Edite la configuracion existente.");

            Obj.CodConfiguracionCorreo = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            NormalizarConfiguracion(Obj);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar(
                    "ConfiguracionCorreo",
                    "Agregar",
                    "CodConfiguracionCorreo:" + Obj.CodConfiguracionCorreo,
                    Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(ConfiguracionCorreoDTO Obj)
        {
            ConfiguracionCorreoDTO ObjAnterior = Obtener(Obj.CodConfiguracionCorreo);
            Obj.Version = ObtenerVersion(Obj.CodConfiguracionCorreo);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            NormalizarConfiguracion(Obj);
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar(
                    "ConfiguracionCorreo",
                    "Editar",
                    "CodConfiguracionCorreo:" + Obj.CodConfiguracionCorreo,
                    Anterior: ObjAnterior,
                    Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(ConfiguracionCorreoDTO Obj)
        {
            ConfiguracionCorreoDTO ObjAnterior = Obtener(Obj.CodConfiguracionCorreo);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("ConfiguracionCorreo", "CodConfiguracionCorreo", Obj.CodConfiguracionCorreo);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar(
                    "ConfiguracionCorreo",
                    "Eliminar",
                    "CodConfiguracionCorreo:" + Obj.CodConfiguracionCorreo,
                    Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarDescripcion(ConfiguracionCorreoDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal bool ExisteConfiguracion()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM ConfiguracionCorreo");
        }

        internal int ObtenerVersion(int CodConfiguracionCorreo)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodConfiguracionCorreo), 1);
        }

        internal List<ConfiguracionCorreoDTO> Log(int CodConfiguracionCorreo)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodConfiguracionCorreo), MapConfiguracionCorreoLog);
        }

        internal string Query(
            TipoDAL TipoDAL = TipoDAL.NoSeleccionado,
            int CodKey = 0,
            ConfiguracionCorreoDTO Obj = null!)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO ConfiguracionCorreo "
                        + "(CodConfiguracionCorreo,Descripcion,DireccionCorreo,NombreUsuario,[Password],"
                        + "ProveedorAutenticacion,TipoAutenticacion,ServidorSalida,PuertoSalida,SSLSalida,"
                        + "TenantId,ClientId,ClientSecret,RedirectUri,AuthorizationUrl,TokenUrl,Scope,"
                        + "RefreshToken,AccessToken,FechaExpiracionToken,FechaUltimaAutenticacion,"
                        + "EstatusAutenticacion,UltimoErrorAutenticacion,Estatus,Version,CodUsuarioCreacion,FechaCreacion)"
                        + "VALUES('"
                        + Obj.CodConfiguracionCorreo + "','"
                        + SqlTexto(Obj.Descripcion) + "','"
                        + SqlTexto(Obj.DireccionCorreo) + "','"
                        + SqlTexto(Obj.NombreUsuario) + "','"
                        + SqlTexto(Obj.Password) + "','"
                        + SqlTexto(Obj.ProveedorAutenticacion) + "','"
                        + SqlTexto(Obj.TipoAutenticacion) + "','"
                        + SqlTexto(Obj.ServidorSalida) + "','"
                        + Obj.PuertoSalida + "',"
                        + SqlBit(Obj.SSLSalida) + ",'"
                        + SqlTexto(Obj.TenantId) + "','"
                        + SqlTexto(Obj.ClientId) + "','"
                        + SqlTexto(Obj.ClientSecret) + "','"
                        + SqlTexto(Obj.RedirectUri) + "','"
                        + SqlTexto(Obj.AuthorizationUrl) + "','"
                        + SqlTexto(Obj.TokenUrl) + "','"
                        + SqlTexto(Obj.Scope) + "','"
                        + SqlTexto(Obj.RefreshToken) + "','"
                        + SqlTexto(Obj.AccessToken) + "',"
                        + SqlFecha(Obj.FechaExpiracionToken) + ","
                        + SqlFecha(Obj.FechaUltimaAutenticacion) + ",'"
                        + SqlTexto(Obj.EstatusAutenticacion) + "','"
                        + SqlTexto(Obj.UltimoErrorAutenticacion) + "',"
                        + SqlBit(Obj.Estatus) + ",'"
                        + Obj.Version + "','"
                        + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                        + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE ConfiguracionCorreo SET "
                        + "Descripcion='" + SqlTexto(Obj.Descripcion) + "',"
                        + "DireccionCorreo='" + SqlTexto(Obj.DireccionCorreo) + "',"
                        + "NombreUsuario='" + SqlTexto(Obj.NombreUsuario) + "',"
                        + "[Password]='" + SqlTexto(Obj.Password) + "',"
                        + "ProveedorAutenticacion='" + SqlTexto(Obj.ProveedorAutenticacion) + "',"
                        + "TipoAutenticacion='" + SqlTexto(Obj.TipoAutenticacion) + "',"
                        + "ServidorSalida='" + SqlTexto(Obj.ServidorSalida) + "',"
                        + "PuertoSalida='" + Obj.PuertoSalida + "',"
                        + "SSLSalida=" + SqlBit(Obj.SSLSalida) + ","
                        + "TenantId='" + SqlTexto(Obj.TenantId) + "',"
                        + "ClientId='" + SqlTexto(Obj.ClientId) + "',"
                        + "ClientSecret='" + SqlTexto(Obj.ClientSecret) + "',"
                        + "RedirectUri='" + SqlTexto(Obj.RedirectUri) + "',"
                        + "AuthorizationUrl='" + SqlTexto(Obj.AuthorizationUrl) + "',"
                        + "TokenUrl='" + SqlTexto(Obj.TokenUrl) + "',"
                        + "Scope='" + SqlTexto(Obj.Scope) + "',"
                        + "RefreshToken='" + SqlTexto(Obj.RefreshToken) + "',"
                        + "AccessToken='" + SqlTexto(Obj.AccessToken) + "',"
                        + "FechaExpiracionToken=" + SqlFecha(Obj.FechaExpiracionToken) + ","
                        + "FechaUltimaAutenticacion=" + SqlFecha(Obj.FechaUltimaAutenticacion) + ","
                        + "EstatusAutenticacion='" + SqlTexto(Obj.EstatusAutenticacion) + "',"
                        + "UltimoErrorAutenticacion='" + SqlTexto(Obj.UltimoErrorAutenticacion) + "',"
                        + "Estatus=" + SqlBit(Obj.Estatus) + ","
                        + "Version=" + Obj.Version + ","
                        + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                        + "FechaActualizacion=GETDATE() "
                        + "WHERE CodConfiguracionCorreo='" + Obj.CodConfiguracionCorreo + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM ConfiguracionCorreo WHERE CodConfiguracionCorreo='" + Obj.CodConfiguracionCorreo + "'";
                case TipoDAL.Listado:
                    return "SELECT " + ColumnasConfiguracionCorreo("A") + " FROM ConfiguracionCorreo A ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodConfiguracionCorreo],A.[Descripcion] FROM ConfiguracionCorreo A WHERE ISNULL(A.[Estatus], 1) = 1 ";
                case TipoDAL.Obtener:
                    return "SELECT " + ColumnasConfiguracionCorreo("A") + " FROM ConfiguracionCorreo A "
                        + "WHERE A.[CodConfiguracionCorreo]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodConfiguracionCorreo]),0)+1 as 'CodConfiguracionCorreo' FROM ConfiguracionCorreo A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM ConfiguracionCorreo A "
                        + "WHERE A.[Descripcion]='" + SqlTexto(Obj.Descripcion) + "' "
                        + "AND A.[CodConfiguracionCorreo] <> '" + Obj.CodConfiguracionCorreo + "'";
                case TipoDAL.Version:
                    return "IF OBJECT_ID('dbo.ConfiguracionCorreo_LOG', 'U') IS NOT NULL "
                        + "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM ConfiguracionCorreo_LOG UNION ALL SELECT * FROM ConfiguracionCorreo) A "
                        + "WHERE A.[CodConfiguracionCorreo]='" + CodKey + "' "
                        + "ELSE SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM ConfiguracionCorreo A "
                        + "WHERE A.[CodConfiguracionCorreo]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "IF OBJECT_ID('dbo.ConfiguracionCorreo_LOG', 'U') IS NOT NULL "
                        + "SELECT " + ColumnasConfiguracionCorreo("A") + ","
                        + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                        + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                        + "FROM (SELECT * FROM ConfiguracionCorreo_LOG UNION ALL SELECT * FROM ConfiguracionCorreo) A "
                        + "WHERE A.[CodConfiguracionCorreo] = '" + CodKey + "' "
                        + "ORDER BY A.Version "
                        + "ELSE SELECT " + ColumnasConfiguracionCorreo("A") + ","
                        + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                        + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                        + "FROM ConfiguracionCorreo A "
                        + "WHERE A.[CodConfiguracionCorreo] = '" + CodKey + "' "
                        + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codConfiguracionCorreo"] = "A.[CodConfiguracionCorreo]",
                ["descripcion"] = "A.[Descripcion]",
                ["direccionCorreo"] = "A.[DireccionCorreo]",
                ["nombreUsuario"] = "A.[NombreUsuario]",
                ["proveedorAutenticacion"] = "A.[ProveedorAutenticacion]",
                ["tipoAutenticacion"] = "A.[TipoAutenticacion]",
                ["servidorSalida"] = "A.[ServidorSalida]",
                ["puertoSalida"] = "A.[PuertoSalida]",
                ["sslSalida"] = "A.[SSLSalida]",
                ["estatusAutenticacion"] = "A.[EstatusAutenticacion]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodConfiguracionCorreo])",
                    "A.[Descripcion]",
                    "A.[DireccionCorreo]",
                    "A.[NombreUsuario]",
                    "A.[ProveedorAutenticacion]",
                    "A.[TipoAutenticacion]",
                    "A.[ServidorSalida]",
                    "CONVERT(VARCHAR(20), A.[PuertoSalida])",
                    "A.[TenantId]",
                    "A.[ClientId]",
                    "A.[Scope]",
                    "A.[EstatusAutenticacion]",
                    "CONVERT(VARCHAR(5), A.[SSLSalida])",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodConfiguracionCorreo] ASC");

            return "SELECT " + ColumnasConfiguracionCorreo("A") + ", "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM ConfiguracionCorreo A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string ColumnasConfiguracionCorreo(string alias)
        {
            return alias + ".[CodConfiguracionCorreo]," + alias + ".[Descripcion],"
                + alias + ".[DireccionCorreo]," + alias + ".[NombreUsuario]," + alias + ".[Password],"
                + alias + ".[ProveedorAutenticacion]," + alias + ".[TipoAutenticacion],"
                + alias + ".[ServidorSalida]," + alias + ".[PuertoSalida]," + alias + ".[SSLSalida],"
                + alias + ".[TenantId]," + alias + ".[ClientId]," + alias + ".[ClientSecret],"
                + alias + ".[RedirectUri]," + alias + ".[AuthorizationUrl]," + alias + ".[TokenUrl],"
                + alias + ".[Scope]," + alias + ".[RefreshToken]," + alias + ".[AccessToken],"
                + alias + ".[FechaExpiracionToken]," + alias + ".[FechaUltimaAutenticacion],"
                + alias + ".[EstatusAutenticacion]," + alias + ".[UltimoErrorAutenticacion],"
                + alias + ".[Estatus]";
        }

        private ConfiguracionCorreoDTO MapConfiguracionCorreo(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            ConfiguracionCorreoDTO Obj = new ConfiguracionCorreoDTO();
            Obj.CodConfiguracionCorreo = Convert.ToInt32(reader["CodConfiguracionCorreo"]);
            Obj.IdConfiguracionCorreo = ObjEncriptacion.Encriptar(Obj.CodConfiguracionCorreo.ToString());
            Obj.Descripcion = LeerTexto(reader, "Descripcion");
            Obj.DireccionCorreo = LeerTexto(reader, "DireccionCorreo");
            Obj.NombreUsuario = LeerTexto(reader, "NombreUsuario");
            Obj.Password = LeerTexto(reader, "Password");
            Obj.ProveedorAutenticacion = NormalizarProveedor(LeerTexto(reader, "ProveedorAutenticacion", "SMTP"));
            Obj.TipoAutenticacion = Obj.ProveedorAutenticacion == "SMTP" ? "Password" : "OAuth2";
            Obj.ServidorSalida = LeerTexto(reader, "ServidorSalida");
            Obj.PuertoSalida = LeerEntero(reader, "PuertoSalida");
            Obj.SSLSalida = LeerBit(reader, "SSLSalida");
            Obj.TenantId = LeerTexto(reader, "TenantId");
            Obj.ClientId = LeerTexto(reader, "ClientId");
            Obj.ClientSecret = LeerTexto(reader, "ClientSecret");
            Obj.RedirectUri = LeerTexto(reader, "RedirectUri");
            Obj.AuthorizationUrl = LeerTexto(reader, "AuthorizationUrl");
            Obj.TokenUrl = LeerTexto(reader, "TokenUrl");
            Obj.Scope = LeerTexto(reader, "Scope");
            Obj.RefreshToken = LeerTexto(reader, "RefreshToken");
            Obj.AccessToken = LeerTexto(reader, "AccessToken");
            Obj.FechaExpiracionToken = LeerFecha(reader, "FechaExpiracionToken");
            Obj.FechaUltimaAutenticacion = LeerFecha(reader, "FechaUltimaAutenticacion");
            Obj.EstatusAutenticacion = LeerTexto(reader, "EstatusAutenticacion", "Pendiente");
            Obj.UltimoErrorAutenticacion = LeerTexto(reader, "UltimoErrorAutenticacion");
            Obj.Estatus = LeerBit(reader, "Estatus", true);
            return Obj;
        }

        private ConfiguracionCorreoDTO MapConfiguracionCorreoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            ConfiguracionCorreoDTO Obj = MapConfiguracionCorreo(reader);
            Obj.Version = LeerEntero(reader, "Version");
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioCreacion))
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion);

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime FechaCreacion))
                Obj.FechaCreacion = FechaCreacion;

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioActualizacion))
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion);

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime FechaActualizacion))
                Obj.FechaActualizacion = FechaActualizacion;
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private void NormalizarConfiguracion(ConfiguracionCorreoDTO Obj)
        {
            Obj.ProveedorAutenticacion = NormalizarProveedor(Obj.ProveedorAutenticacion);
            Obj.TipoAutenticacion = Obj.ProveedorAutenticacion == "SMTP" ? "Password" : "OAuth2";
            Obj.EstatusAutenticacion = string.IsNullOrWhiteSpace(Obj.EstatusAutenticacion)
                ? "Pendiente"
                : Obj.EstatusAutenticacion.Trim();

            if (Obj.ProveedorAutenticacion == "SMTP")
            {
                Obj.TenantId = "";
                Obj.ClientId = "";
                Obj.ClientSecret = "";
                Obj.RedirectUri = "";
                Obj.AuthorizationUrl = "";
                Obj.TokenUrl = "";
                Obj.Scope = "";
                Obj.RefreshToken = "";
                Obj.AccessToken = "";
                Obj.FechaExpiracionToken = null;
                Obj.FechaUltimaAutenticacion = null;
                Obj.EstatusAutenticacion = "Pendiente";
                Obj.UltimoErrorAutenticacion = "";
            }
            else
            {
                Obj.Password = "";
            }
        }

        private string NormalizarProveedor(string? proveedor)
        {
            string valor = (proveedor ?? "").Trim();

            return valor switch
            {
                "Office365" => "Office365",
                "Gmail" => "Gmail",
                _ => "SMTP",
            };
        }

        private MsjDB Error(string mensaje)
        {
            return new MsjDB { Estatus = false, Msj = mensaje, Key = 0 };
        }

        private int LeerEntero(Microsoft.Data.SqlClient.SqlDataReader reader, string columna)
        {
            return reader[columna] == DBNull.Value ? 0 : Convert.ToInt32(reader[columna]);
        }

        private string LeerTexto(
            Microsoft.Data.SqlClient.SqlDataReader reader,
            string columna,
            string valorDefault = "")
        {
            if (reader[columna] == DBNull.Value) return valorDefault;

            string valor = reader[columna].ToString() ?? "";
            return string.IsNullOrWhiteSpace(valor) ? valorDefault : valor;
        }

        private bool LeerBit(Microsoft.Data.SqlClient.SqlDataReader reader, string columna, bool valorDefault = false)
        {
            return reader[columna] == DBNull.Value ? valorDefault : Convert.ToBoolean(reader[columna]);
        }

        private DateTime? LeerFecha(Microsoft.Data.SqlClient.SqlDataReader reader, string columna)
        {
            return reader[columna] == DBNull.Value ? null : Convert.ToDateTime(reader[columna]);
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string SqlBit(bool valor)
        {
            return valor ? "1" : "0";
        }

        private string SqlFecha(DateTime? valor)
        {
            return valor.HasValue
                ? "'" + valor.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture) + "'"
                : "NULL";
        }
    }
}





