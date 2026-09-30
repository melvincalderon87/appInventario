using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Producto
{
    /// <summary>
    /// DAO para el mantenimiento de productos.
    /// </summary>
    internal class ProductoDAO
    {
        private ProductoDTO Obj = new ProductoDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();
        private readonly string[] TiposProducto = { "Base", "Aditivo", "Etanol" };

        internal PaginacionResultado<ProductoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<ProductoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapProducto(reader);
            });

            return new PaginacionResultado<ProductoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Producto"].ToString(),
                Value = reader["CodProducto"].ToString()
            });
        }

        internal ProductoDTO Obtener(string CodProducto)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodProducto), MapProducto).FirstOrDefault() ?? new ProductoDTO();
        }

        internal string ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), "1");
        }

        internal MsjDB Agregar(ProductoDTO Obj)
        {
            Obj.CodProducto = (Obj.CodProducto ?? "").Trim();
            if (Obj.CodProducto.Length == 0)
                Obj.CodProducto = ObtenerKey();

            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionTipoProducto = ValidarCamposProducto(Obj);
            if (!validacionTipoProducto.Estatus)
                return validacionTipoProducto;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Producto", "CREADO", "CodProducto:" + Obj.CodProducto, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(ProductoDTO Obj)
        {
            ProductoDTO ObjAnterior = Obtener(Obj.CodProducto);
            Obj.Version = ObtenerVersion(Obj.CodProducto);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionTipoProducto = ValidarCamposProducto(Obj);
            if (!validacionTipoProducto.Estatus)
                return validacionTipoProducto;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Producto", "EDITADO", "CodProducto:" + Obj.CodProducto, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(ProductoDTO Obj)
        {
            ProductoDTO ObjAnterior = Obtener(Obj.CodProducto);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Producto", "CodProducto", Obj.CodProducto);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Producto", "ELIMINADO", "CodProducto:" + Obj.CodProducto, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarProducto(ProductoDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(string CodProducto)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodProducto), 1);
        }

        internal List<ProductoDTO> Log(string CodProducto)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodProducto), MapProductoLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", ProductoDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Producto (CodProducto,CodTipoProducto,Tipo,Producto,DescripcionCorta,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES('"
                            + Obj.CodProducto + "',N'"
                            + SqlTexto(Obj.CodTipoProducto) + "',N'"
                            + SqlTexto(Obj.Tipo) + "',N'"
                            + SqlTexto(Obj.Producto) + "','"
                            + SqlTexto(Obj.DescripcionCorta) + "','"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Producto SET "
                            + "CodTipoProducto=N'" + SqlTexto(Obj.CodTipoProducto) + "',"
                            + "Tipo=N'" + SqlTexto(Obj.Tipo) + "',"
                            + "Producto=N'" + SqlTexto(Obj.Producto) + "',"
                            + "DescripcionCorta=N'" + SqlTexto(Obj.DescripcionCorta) + "',"
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodProducto='" + Obj.CodProducto + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM Producto WHERE CodProducto='" + Obj.CodProducto + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodProducto],A.[Producto] FROM Producto A WHERE ISNULL(A.[Estatus], 1)=1 ORDER BY A.[Producto] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodProducto]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(CONVERT(INT, A.[CodProducto])),0)+1 as 'CodProducto' FROM Producto A WHERE ISNUMERIC(A.[CodProducto])=1 ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Producto A "
                        + "WHERE A.[Producto]=N'" + SqlTexto(Obj.Producto) + "' "
                        + "AND A.[CodTipoProducto]=N'" + SqlTexto(Obj.CodTipoProducto) + "' "
                        + "AND A.[CodProducto] <> '" + Obj.CodProducto + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Producto_LOG UNION ALL SELECT * FROM Producto) A " +
                        "WHERE A.[CodProducto]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodProducto], A.[CodTipoProducto], ISNULL(TP.[Descripcion], '') AS [TipoProducto],A.[Tipo],A.[Producto],A.[DescripcionCorta],ISNULL(A.[Estatus], 1) AS [Estatus],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (SELECT * FROM Producto_LOG UNION ALL SELECT * FROM Producto) A "
                      + "LEFT JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] "
                      + "WHERE A.[CodProducto] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodProducto],A.[CodTipoProducto],ISNULL(TP.[Descripcion], '') AS [TipoProducto],A.[Tipo],A.[Producto],A.[DescripcionCorta],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM Producto A "
                + "LEFT JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codProducto"] = "A.[CodProducto]",
                ["codTipoProducto"] = "A.[CodTipoProducto]",
                ["tipo"] = "A.[Tipo]",
                ["tipoProducto"] = "TP.[Descripcion]",
                ["producto"] = "A.[Producto]",
                ["descripcioncorta"] = "A.[DescripcionCorta]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodProducto])",
                    "A.[Tipo]",
                    "A.[CodTipoProducto]",
                    "TP.[Descripcion]",
                    "A.[Producto]",
                    "A.[DescripcionCorta]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodProducto] ASC");

            return "SELECT A.[CodProducto],A.[CodTipoProducto],ISNULL(TP.[Descripcion], '') AS [TipoProducto],A.[Tipo],A.[Producto],A.[DescripcionCorta],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Producto A "
                + "LEFT JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private ProductoDTO MapProducto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            ProductoDTO Obj = new ProductoDTO();
            Obj.CodProducto = reader["CodProducto"].ToString() ?? "";
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto);
            Obj.CodTipoProducto = reader["CodTipoProducto"].ToString() ?? "";
            Obj.IdTipoProducto = ObjEncriptacion.Encriptar(Obj.CodTipoProducto);
            Obj.TipoProducto = reader["TipoProducto"].ToString() ?? "";
            Obj.Tipo = reader["Tipo"].ToString() ?? "";
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.DescripcionCorta = reader["DescripcionCorta"].ToString() ?? "";
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private ProductoDTO MapProductoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            ProductoDTO Obj = MapProducto(reader);
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

        private MsjDB ValidarCamposProducto(ProductoDTO Obj)
        {
            Obj.CodProducto = (Obj.CodProducto ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodProducto))
                return Error("El codigo de producto es requerido.");

            if (Obj.CodProducto.Length > 20)
                return Error("El codigo de producto debe tener maximo 20 caracteres de longitud.");

            Obj.CodTipoProducto = (Obj.CodTipoProducto ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodTipoProducto))
                return Error("El tipo de producto es requerido.");

            if (Obj.CodTipoProducto.Length > 20)
                return Error("El codigo de tipo de producto debe tener maximo 20 caracteres.");

            if (!ObjDAL.EjecutarExiste("SELECT 1 FROM TipoProducto A WHERE A.[CodTipoProducto]=N'" + SqlTexto(Obj.CodTipoProducto) + "'"))
                return Error("El tipo de producto seleccionado no existe.");

            Obj.Tipo = (Obj.Tipo ?? "").Trim();
            if (string.IsNullOrWhiteSpace(Obj.Tipo))
                return Error("El tipo es requerido.");

            if (Obj.Tipo.Length > 20)
                return Error("El tipo debe tener maximo 20 caracteres de longitud.");

            if (!Array.Exists(TiposProducto, item => item.Equals(Obj.Tipo, StringComparison.Ordinal)))
                return Error("El tipo debe ser Base, Aditivo o Etanol.");

            return Ok();
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




