using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Metro
{
    /// <summary>
    /// DAO para el mantenimiento de metros.
    /// </summary>
    internal class MetroDAO
    {
        private static readonly HashSet<string> TiposMetroPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Turbina",
            "Desplazamiento Positivo",
            "Modelo Genesis"
        };

        private readonly DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<MetroDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<MetroDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapMetro(reader);
            });

            return new PaginacionResultado<MetroDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Metro"].ToString(),
                Value = reader["CodMetro"].ToString()
            });
        }

        internal MetroDTO Obtener(string CodMetro)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodMetro), MapMetro).FirstOrDefault() ?? new MetroDTO();
        }

        internal MsjDB Agregar(MetroDTO Obj)
        {
            MsjDB validacion = ValidarMetro(Obj);
            if (!validacion.Estatus)
                return validacion;

            if (ExisteCodigo(Obj.CodMetro))
                return Error("El codigo de metro ya existe.");

            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Metro", "CREADO", "CodMetro:" + Obj.CodMetro, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(MetroDTO Obj)
        {
            MsjDB validacion = ValidarMetro(Obj);
            if (!validacion.Estatus)
                return validacion;

            MetroDTO ObjAnterior = Obtener(Obj.CodMetro);
            Obj.Version = ObtenerVersion(Obj.CodMetro);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Metro", "EDITADO", "CodMetro:" + Obj.CodMetro, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(MetroDTO Obj)
        {
            Obj.CodMetro = (Obj.CodMetro ?? "").Trim();
            if (string.IsNullOrWhiteSpace(Obj.CodMetro))
                return Error("El codigo de metro es requerido.");

            MetroDTO ObjAnterior = Obtener(Obj.CodMetro);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Metro", "CodMetro", Obj.CodMetro);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Metro", "ELIMINADO", "CodMetro:" + Obj.CodMetro, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool ExisteCodigo(string CodMetro)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Metro A WHERE A.[CodMetro]=N'" + SqlTexto(CodMetro) + "'");
        }

        internal int ObtenerVersion(string CodMetro)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodMetro), 1);
        }

        internal List<MetroDTO> Log(string CodMetro)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodMetro), MapMetroLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", MetroDTO Obj = null!)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Metro (CodBahia,CodBrazo,CodProducto,CodMetro,Metro,TipoMetro,Modelo,Serie,Comentario,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES(N'"
                            + SqlTexto(Obj.CodBahia) + "',N'"
                            + SqlTexto(Obj.CodBrazo) + "',N'"
                            + SqlTexto(Obj.CodProducto) + "',N'"
                            + SqlTexto(Obj.CodMetro) + "',N'"
                            + SqlTexto(Obj.Metro) + "',N'"
                            + SqlTexto(Obj.TipoMetro) + "',N'"
                            + SqlTexto(Obj.Modelo) + "',N'"
                            + SqlTexto(Obj.Serie) + "',N'"
                            + SqlTexto(Obj.Comentario) + "','"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "',N'"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Metro SET "
                            + "CodBahia=N'" + SqlTexto(Obj.CodBahia) + "',"
                            + "CodBrazo=N'" + SqlTexto(Obj.CodBrazo) + "',"
                            + "CodProducto=N'" + SqlTexto(Obj.CodProducto) + "',"
                            + "Metro=N'" + SqlTexto(Obj.Metro) + "',"
                            + "TipoMetro=N'" + SqlTexto(Obj.TipoMetro) + "',"
                            + "Modelo=N'" + SqlTexto(Obj.Modelo) + "',"
                            + "Serie=N'" + SqlTexto(Obj.Serie) + "',"
                            + "Comentario=N'" + SqlTexto(Obj.Comentario) + "',"
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodMetro=N'" + SqlTexto(Obj.CodMetro) + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM Metro WHERE CodMetro=N'" + SqlTexto(Obj.CodMetro) + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodMetro],A.[Metro] FROM Metro A WHERE ISNULL(A.[Estatus], 1)=1 ORDER BY A.[Metro] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodMetro]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Metro A "
                        + "WHERE A.[Metro]=N'" + SqlTexto(Obj.Metro) + "' "
                        + "AND A.[CodMetro] <> N'" + SqlTexto(Obj.CodMetro) + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT [CodMetro],[Version] FROM Metro_LOG UNION ALL SELECT [CodMetro],[Version] FROM Metro) A "
                        + "WHERE A.[CodMetro]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Log:
                    return SelectLogBase()
                      + "FROM (" + SelectUnionLog("Metro_LOG") + " UNION ALL " + SelectUnionLog("Metro") + ") A "
                      + JoinBase()
                      + "WHERE A.[CodMetro] = N'" + SqlTexto(CodKey) + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[CodBrazo],ISNULL(BR.[Brazo], '') AS [Brazo],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodMetro],A.[Metro],A.[TipoMetro],A.[Modelo],A.[Serie],A.[Comentario],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM Metro A "
                + JoinBase();
        }

        private string SelectLogBase()
        {
            return "SELECT A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[CodBrazo],ISNULL(BR.[Brazo], '') AS [Brazo],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodMetro],A.[Metro],A.[TipoMetro],A.[Modelo],A.[Serie],A.[Comentario],A.[Estatus],"
                + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] ";
        }

        private string JoinBase()
        {
            return "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                + "LEFT JOIN Brazo BR ON A.[CodBrazo] = BR.[CodBrazo] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = CONVERT(NVARCHAR(20), P.[CodProducto]) ";
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodBahia],[CodBrazo],[CodProducto],[CodMetro],[Metro],[TipoMetro],[Modelo],[Serie],[Comentario],[Estatus],"
                + "[Version],[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog] "
                + "FROM " + tabla;
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codBahia"] = "A.[CodBahia]",
                ["bahia"] = "B.[Bahia]",
                ["codBrazo"] = "A.[CodBrazo]",
                ["brazo"] = "BR.[Brazo]",
                ["codProducto"] = "A.[CodProducto]",
                ["producto"] = "P.[Producto]",
                ["codMetro"] = "A.[CodMetro]",
                ["metro"] = "A.[Metro]",
                ["tipoMetro"] = "A.[TipoMetro]",
                ["modelo"] = "A.[Modelo]",
                ["serie"] = "A.[Serie]",
                ["comentario"] = "A.[Comentario]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "A.[CodBahia]",
                    "B.[Bahia]",
                    "A.[CodBrazo]",
                    "BR.[Brazo]",
                    "A.[CodProducto]",
                    "P.[Producto]",
                    "A.[CodMetro]",
                    "A.[Metro]",
                    "A.[TipoMetro]",
                    "A.[Modelo]",
                    "A.[Serie]",
                    "A.[Comentario]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodMetro] ASC");

            return "SELECT A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[CodBrazo],ISNULL(BR.[Brazo], '') AS [Brazo],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodMetro],A.[Metro],A.[TipoMetro],A.[Modelo],A.[Serie],A.[Comentario],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Metro A "
                + JoinBase()
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private MsjDB ValidarMetro(MetroDTO Obj)
        {
            Obj.CodBahia = (Obj.CodBahia ?? "").Trim();
            Obj.CodBrazo = (Obj.CodBrazo ?? "").Trim();
            Obj.CodProducto = (Obj.CodProducto ?? "").Trim();
            Obj.CodMetro = (Obj.CodMetro ?? "").Trim();
            Obj.Metro = (Obj.Metro ?? "").Trim();
            Obj.TipoMetro = (Obj.TipoMetro ?? "").Trim();
            Obj.Modelo = (Obj.Modelo ?? "").Trim();
            Obj.Serie = (Obj.Serie ?? "").Trim();
            Obj.Comentario = (Obj.Comentario ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodBahia))
                return Error("La bahia es requerida.");
            if (Obj.CodBahia.Length > 20)
                return Error("El codigo de bahia debe tener maximo 20 caracteres.");
            if (!ObjDAL.EjecutarExiste("SELECT 1 FROM Bahia A WHERE A.[CodBahia]=N'" + SqlTexto(Obj.CodBahia) + "'"))
                return Error("La bahia seleccionada no existe.");

            if (string.IsNullOrWhiteSpace(Obj.CodBrazo))
                return Error("El brazo es requerido.");
            if (Obj.CodBrazo.Length > 20)
                return Error("El codigo de brazo debe tener maximo 20 caracteres.");
            if (!ObjDAL.EjecutarExiste("SELECT 1 FROM Brazo A WHERE A.[CodBrazo]=N'" + SqlTexto(Obj.CodBrazo) + "' AND A.[CodBahia]=N'" + SqlTexto(Obj.CodBahia) + "'"))
                return Error("El brazo seleccionado no existe para la bahia indicada.");

            if (string.IsNullOrWhiteSpace(Obj.CodProducto))
                return Error("El producto es requerido.");
            if (Obj.CodProducto.Length > 20)
                return Error("El codigo de producto debe tener maximo 20 caracteres.");
            if (!ObjDAL.EjecutarExiste("SELECT 1 FROM Producto A WHERE CONVERT(NVARCHAR(20), A.[CodProducto])=N'" + SqlTexto(Obj.CodProducto) + "'"))
                return Error("El producto seleccionado no existe.");

            if (string.IsNullOrWhiteSpace(Obj.CodMetro))
                return Error("El codigo de metro es requerido.");
            if (Obj.CodMetro.Length > 20)
                return Error("El codigo de metro debe tener maximo 20 caracteres.");

            if (string.IsNullOrWhiteSpace(Obj.Metro))
                return Error("El metro es requerido.");
            if (Obj.Metro.Length > 200)
                return Error("El metro debe tener maximo 200 caracteres.");

            if (string.IsNullOrWhiteSpace(Obj.TipoMetro))
                return Error("El tipo de metro es requerido.");
            if (Obj.TipoMetro.Length > 50)
                return Error("El tipo de metro debe tener maximo 50 caracteres.");
            if (!TiposMetroPermitidos.Contains(Obj.TipoMetro))
                return Error("El tipo de metro seleccionado no es valido.");

            if (string.IsNullOrWhiteSpace(Obj.Modelo))
                return Error("El modelo es requerido.");
            if (Obj.Modelo.Length > 200)
                return Error("El modelo debe tener maximo 200 caracteres.");

            if (string.IsNullOrWhiteSpace(Obj.Serie))
                return Error("La serie es requerida.");
            if (Obj.Serie.Length > 200)
                return Error("La serie debe tener maximo 200 caracteres.");

            if (Obj.Comentario.Length > 250)
                return Error("El comentario debe tener maximo 250 caracteres.");

            return Ok();
        }

        private MetroDTO MapMetro(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            MetroDTO Obj = new MetroDTO();
            Obj.CodBahia = reader["CodBahia"].ToString() ?? "";
            Obj.IdBahia = string.IsNullOrWhiteSpace(Obj.CodBahia) ? null : ObjEncriptacion.Encriptar(Obj.CodBahia);
            Obj.Bahia = reader["Bahia"].ToString() ?? "";
            Obj.CodBrazo = reader["CodBrazo"].ToString() ?? "";
            Obj.IdBrazo = string.IsNullOrWhiteSpace(Obj.CodBrazo) ? null : ObjEncriptacion.Encriptar(Obj.CodBrazo);
            Obj.Brazo = reader["Brazo"].ToString() ?? "";
            Obj.CodProducto = reader["CodProducto"].ToString() ?? "";
            Obj.IdProducto = string.IsNullOrWhiteSpace(Obj.CodProducto) ? null : ObjEncriptacion.Encriptar(Obj.CodProducto);
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CodMetro = reader["CodMetro"].ToString() ?? "";
            Obj.IdMetro = string.IsNullOrWhiteSpace(Obj.CodMetro) ? null : ObjEncriptacion.Encriptar(Obj.CodMetro);
            Obj.Metro = reader["Metro"].ToString() ?? "";
            Obj.TipoMetro = reader["TipoMetro"].ToString() ?? "";
            Obj.Modelo = reader["Modelo"].ToString() ?? "";
            Obj.Serie = reader["Serie"].ToString() ?? "";
            Obj.Comentario = reader["Comentario"].ToString() ?? "";
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private MetroDTO MapMetroLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            MetroDTO Obj = MapMetro(reader);
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

        private MsjDB Ok()
        {
            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }

        private MsjDB Error(string mensaje)
        {
            return new MsjDB { Estatus = false, Msj = mensaje, Key = 0 };
        }
    }
}
