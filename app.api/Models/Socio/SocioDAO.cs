using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Suplidor
{
    /// <summary>
    /// DAO para el mantenimiento de suplidores.
    /// </summary>
    internal class SuplidorDAO
    {
        private SuplidorDTO Obj = new SuplidorDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<SuplidorDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "", string codUsuario = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<SuplidorDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, codUsuario), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapSuplidor(reader);
            });

            return new PaginacionResultado<SuplidorDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar(string codUsuario = "")
        {
            string filtroUsuario = FiltroUsuario(codUsuario, "A");
            return ObjDAL.EjecutarReader("SELECT A.[CodSuplidor] AS [CodSuplidor],A.[Suplidor] AS [Suplidor] FROM Suplidor A WHERE ISNULL(A.[Estatus], 1)=1 " + filtroUsuario + " ORDER BY A.[Suplidor]", reader => new SelectListItem()
            {
                Text = reader["Suplidor"].ToString(),
                Value = reader["CodSuplidor"].ToString()
            });
        }

        internal SuplidorDTO Obtener(string CodSuplidor, string codUsuario = "")
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodSuplidor) + FiltroUsuario(codUsuario, "A"), MapSuplidor).FirstOrDefault() ?? new SuplidorDTO();
        }

        internal string ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), "1");
        }

        internal MsjDB Agregar(SuplidorDTO Obj)
        {
            MsjDB validacionSocio = ValidarCodigoSocio(Obj);
            if (!validacionSocio.Estatus)
                return validacionSocio;

            Obj.CodSuplidor = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Suplidor", "CREADO", "CodSuplidor:" + Obj.CodSuplidor, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(SuplidorDTO Obj)
        {
            MsjDB validacionSocio = ValidarCodigoSocio(Obj);
            if (!validacionSocio.Estatus)
                return validacionSocio;

            SuplidorDTO ObjAnterior = Obtener(Obj.CodSuplidor);
            Obj.Version = ObtenerVersion(Obj.CodSuplidor);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Suplidor", "EDITADO", "CodSuplidor:" + Obj.CodSuplidor, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(SuplidorDTO Obj)
        {
            MsjDB validacionSocio = ValidarCodigoSocio(Obj);
            if (!validacionSocio.Estatus)
                return validacionSocio;

            SuplidorDTO ObjAnterior = Obtener(Obj.CodSuplidor);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Suplidor", "CodSuplidor", Obj.CodSuplidor);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Suplidor", "ELIMINADO", "CodSuplidor:" + Obj.CodSuplidor, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarSuplidor(SuplidorDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(string CodSuplidor)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodSuplidor), 1);
        }

        internal List<SuplidorDTO> Log(string CodSuplidor)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodSuplidor), MapSuplidorLog);
        }

        internal List<SuplidorProductoDistribucionDTO> ListarDistribucion(string codSuplidor)
        {
            string sql = "SELECT D.CodProducto, ISNULL(P.Producto,'') AS Producto, D.PorcentajeDistribucion FROM SuplidorProductoDistribucion D LEFT JOIN Producto P ON P.CodProducto=D.CodProducto WHERE D.CodSuplidor='" + SqlTexto(codSuplidor) + "' ORDER BY P.Producto";
            return ObjDAL.EjecutarReader(sql, r => new SuplidorProductoDistribucionDTO { CodProducto = r["CodProducto"].ToString() ?? "", Producto = r["Producto"].ToString() ?? "", PorcentajeDistribucion = Convert.ToDecimal(r["PorcentajeDistribucion"]) });
        }

        internal MsjDB GuardarDistribucion(string codSuplidor, List<SuplidorProductoDistribucionDTO>? detalles)
        {
            if (string.IsNullOrWhiteSpace(codSuplidor) || Obtener(codSuplidor).CodSuplidor == "") return new MsjDB { Estatus = false, Msj = "El suplidor no existe." };
            detalles ??= new List<SuplidorProductoDistribucionDTO>();
            if (detalles.Any(d => string.IsNullOrWhiteSpace(d.CodProducto) || d.PorcentajeDistribucion < 0 || d.PorcentajeDistribucion > 100)) return new MsjDB { Estatus = false, Msj = "El producto y el porcentaje de distribucion (0 a 100) son requeridos." };
            if (detalles.GroupBy(d => d.CodProducto).Any(g => g.Count() > 1)) return new MsjDB { Estatus = false, Msj = "No puede repetir un producto." };
            string usuario = SqlTexto(new VerificarUsuario().SesionUsuario());

            foreach (var detalle in detalles)
            {
                string producto = SqlTexto(detalle.CodProducto.Trim());
                string porcentaje = detalle.PorcentajeDistribucion.ToString(System.Globalization.CultureInfo.InvariantCulture);
                string condicion = "CodSuplidor='" + SqlTexto(codSuplidor) + "' AND CodProducto='" + producto + "'";

                MsjDB = ObjDAL.Ejecutar(
                    "IF EXISTS (SELECT 1 FROM SuplidorProductoDistribucion WHERE " + condicion + ") "
                    + "BEGIN "
                    + "INSERT INTO SuplidorProductoDistribucion_LOG (CodSuplidor,CodProducto,PorcentajeDistribucion,Version,Estatus,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                    + "SELECT CodSuplidor,CodProducto,PorcentajeDistribucion,Version,1,CodUsuarioCreacion,FechaCreacion,N'" + usuario + "',GETDATE(),NULL,NULL,'U' FROM SuplidorProductoDistribucion WHERE " + condicion + " AND PorcentajeDistribucion<>" + porcentaje + "; "
                    + "UPDATE SuplidorProductoDistribucion SET PorcentajeDistribucion=" + porcentaje + ",Version=Version+1,CodUsuarioActualizacion=N'" + usuario + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE " + condicion + " AND PorcentajeDistribucion<>" + porcentaje + "; "
                    + "END ELSE "
                    + "INSERT INTO SuplidorProductoDistribucion (CodSuplidor,CodProducto,PorcentajeDistribucion,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES ('" + SqlTexto(codSuplidor) + "','" + producto + "'," + porcentaje + ",1,N'" + usuario + "',GETDATE(),'C')",
                    Key: false, tipoDAL: TipoDAL.Editar);

                if (!MsjDB.Estatus) return MsjDB;
            }

            string productosActuales = string.Join(",", detalles.Select(d => "'" + SqlTexto(d.CodProducto.Trim()) + "'"));
            string condicionEliminacion = "CodSuplidor='" + SqlTexto(codSuplidor) + "'" + (detalles.Any() ? " AND CodProducto NOT IN (" + productosActuales + ")" : "");
            MsjDB = ObjDAL.Ejecutar(
                "INSERT INTO SuplidorProductoDistribucion_LOG (CodSuplidor,CodProducto,PorcentajeDistribucion,Version,Estatus,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodSuplidor,CodProducto,PorcentajeDistribucion,Version,0,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,N'" + usuario + "',GETDATE(),'D' FROM SuplidorProductoDistribucion WHERE " + condicionEliminacion + "; "
                + "DELETE FROM SuplidorProductoDistribucion WHERE " + condicionEliminacion,
                Key: false, tipoDAL: TipoDAL.Eliminar);
            if (!MsjDB.Estatus) return MsjDB;

            return new MsjDB { Estatus = true, Msj = "Distribucion guardada correctamente." };
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", SuplidorDTO Obj = null)
        {
            if (Obj != null && Obj.CodSocio != null)
                Obj.CodSocio = Obj.CodSocio.Trim();

            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Suplidor (CodSuplidor,CodSocio,Suplidor,SuplidorNombreCorto,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj.CodSuplidor + "',N'"
                            + SqlTexto(Obj.CodSocio) + "',N'"
                            + SqlTexto(Obj.Suplidor) + "',N'"
                            + SqlTexto(Obj.SuplidorNombreCorto) + "','"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Suplidor SET "
                            + "CodSocio=N'" + SqlTexto(Obj.CodSocio) + "',"
                            + "Suplidor=N'" + SqlTexto(Obj.Suplidor) + "',"
                            + "SuplidorNombreCorto=N'" + SqlTexto(Obj.SuplidorNombreCorto) + "',"
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodSuplidor='" + Obj.CodSuplidor + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM Suplidor WHERE CodSuplidor='" + Obj.CodSuplidor + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodSuplidor] AS [CodSuplidor],A.[Suplidor] AS [Suplidor] FROM Suplidor A WHERE ISNULL(A.[Estatus], 1)=1 ORDER BY A.[Suplidor] ";
                case TipoDAL.Obtener:
                    return SelectBase() +
                           "WHERE A.[CodSuplidor]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(TRY_CAST(A.[CodSuplidor] AS INT)),0)+1 as 'CodSuplidor' FROM Suplidor A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Suplidor A "
                        + "WHERE A.[Suplidor]='" + SqlTexto(Obj.Suplidor) + "' "
                        + "AND A.[CodSuplidor] <> '" + Obj.CodSuplidor + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Suplidor_LOG UNION ALL SELECT * FROM Suplidor) A " +
                        "WHERE A.[CodSuplidor]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodSuplidor] AS [CodSuplidor],A.[CodSocio],S.[Socio],A.[Suplidor] AS [Suplidor],A.[SuplidorNombreCorto] AS [SuplidorNombreCorto],A.[Estatus],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (SELECT * FROM Suplidor_LOG UNION ALL SELECT * FROM Suplidor) A "
                      + "LEFT JOIN Socio S ON A.[CodSocio] = S.[CodSocio] "
                      + "WHERE A.[CodSuplidor] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodSuplidor] AS [CodSuplidor],A.[CodSocio],S.[Socio],A.[Suplidor] AS [Suplidor],A.[SuplidorNombreCorto] AS [SuplidorNombreCorto],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM Suplidor A "
                + "LEFT JOIN Socio S ON A.[CodSocio] = S.[CodSocio] ";
        }

        private string QueryListado(PaginacionParametros paginacion, string codUsuario = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codSuplidor"] = "A.[CodSuplidor]",
                ["codSocio"] = "A.[CodSocio]",
                ["socio"] = "S.[Socio]",
                ["suplidor"] = "A.[Suplidor]",
                ["suplidornombrecorto"] = "A.[SuplidorNombreCorto]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 " + FiltroUsuario(codUsuario, "A")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodSuplidor])",
                    "CONVERT(VARCHAR(20), A.[CodSocio])",
                    "S.[Socio]",
                    "A.[Suplidor]",
                    "A.[SuplidorNombreCorto]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodSuplidor] ASC");

            return "SELECT A.[CodSuplidor] AS [CodSuplidor],A.[CodSocio],S.[Socio],A.[Suplidor] AS [Suplidor],A.[SuplidorNombreCorto] AS [SuplidorNombreCorto],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Suplidor A "
                + "LEFT JOIN Socio S ON A.[CodSocio] = S.[CodSocio] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private SuplidorDTO MapSuplidor(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            SuplidorDTO Obj = new SuplidorDTO();
            Obj.CodSuplidor = reader["CodSuplidor"]?.ToString() ?? "";
            Obj.IdSuplidor = ObjEncriptacion.Encriptar(Obj.CodSuplidor.ToString());
            Obj.CodSocio = reader["CodSocio"]?.ToString() ?? "";
            Obj.IdSocio = ObjEncriptacion.Encriptar(Obj.CodSocio);
            Obj.Socio = reader["Socio"].ToString() ?? "";
            Obj.Suplidor = reader["Suplidor"].ToString() ?? "";
            Obj.SuplidorNombreCorto = reader["SuplidorNombreCorto"].ToString() ?? "";
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private string FiltroUsuario(string codUsuario, string alias)
        {
            if (string.IsNullOrWhiteSpace(codUsuario)) return "";
            string usuario = SqlTexto(codUsuario);
            return " AND (NOT EXISTS (SELECT 1 FROM UsuarioSuplidor US0 WHERE US0.CodUsuario=N'" + usuario + "' AND US0.Estatus=1) "
                + "OR EXISTS (SELECT 1 FROM UsuarioSuplidor US WHERE US.CodUsuario=N'" + usuario + "' AND US.CodSuplidor=" + alias + ".CodSuplidor AND US.Estatus=1)) ";
        }

        private SuplidorDTO MapSuplidorLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            SuplidorDTO Obj = MapSuplidor(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion.ToString());

            if (reader["FechaCreacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaCreacion"].ToString(), out DateTime FechaCreacion))
                Obj.FechaCreacion = FechaCreacion;

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion.ToString());

            if (reader["FechaActualizacion"] != DBNull.Value &&
                DateTime.TryParse(reader["FechaActualizacion"].ToString(), out DateTime FechaActualizacion))
                Obj.FechaActualizacion = FechaActualizacion;
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private MsjDB ValidarCodigoSocio(SuplidorDTO Obj)
        {
            Obj.CodSocio = (Obj.CodSocio ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodSocio))
                return new MsjDB { Estatus = false, Msj = "El codigo de socio es requerido.", Key = 0 };

            if (Obj.CodSocio.Length > 20)
                return new MsjDB { Estatus = false, Msj = "El codigo de socio debe tener maximo 20 caracteres.", Key = 0 };

            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }
    }
}




