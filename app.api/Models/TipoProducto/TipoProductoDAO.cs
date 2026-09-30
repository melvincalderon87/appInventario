using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;


namespace app.Models.TipoProducto
{
    /// <summary>
    /// 
    /// </summary>
    internal class TipoProductoDAO
    {
        private TipoProductoDTO Obj = new TipoProductoDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal PaginacionResultado<TipoProductoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<TipoProductoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapTipoProducto(reader);
            });

            return new PaginacionResultado<TipoProductoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }
        //Listado para ComboBox
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodTipoProducto"].ToString()
            });
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="CodTipoProducto"></param>
        /// <returns></returns>
        internal TipoProductoDTO Obtener(string CodTipoProducto)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodTipoProducto), MapTipoProducto).FirstOrDefault() ?? new TipoProductoDTO();
        }
        internal MsjDB Agregar(TipoProductoDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTipoProducto(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoProducto", "CREADO", "CodTipoProducto:" + Obj.CodTipoProducto, Nuevo: Obj);
            }

            return MsjDB;
        }
        internal MsjDB Editar(TipoProductoDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTipoProducto(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            TipoProductoDTO ObjAnterior = Obtener(Obj.CodTipoProducto);
            Obj.Version = ObtenerVersion(Obj.CodTipoProducto);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoProducto", "EDITADO", "CodTipoProducto:" + Obj.CodTipoProducto, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }
        internal MsjDB Eliminar(TipoProductoDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTipoProducto(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            TipoProductoDTO ObjAnterior = Obtener(Obj.CodTipoProducto);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("TipoProducto", "CodTipoProducto", Obj.CodTipoProducto);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("TipoProducto", "ELIMINADO", "CodTipoProducto:" + Obj.CodTipoProducto, Anterior: ObjAnterior);
            }

            return MsjDB;
        }
        internal bool VerificarDescripcion(TipoProductoDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }
        internal int ObtenerVersion(string CodTipoProducto)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodTipoProducto), 1);
        }
        internal List<TipoProductoDTO> Log(string CodTipoProducto)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodTipoProducto), MapTipoProductoLog);
        }
        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", TipoProductoDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO TipoProducto (CodTipoProducto,Descripcion,DescripcionCorta,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES(N'"
                            + SqlTexto(Obj.CodTipoProducto) + "',N'"
                            + SqlTexto(Obj.Descripcion) + "','"
                            + SqlTexto(Obj.DescripcionCorta) + "','"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE TipoProducto SET "
                            + "Descripcion=N'" + SqlTexto(Obj.Descripcion) + "',"
                            + "DescripcionCorta=N'" + SqlTexto(Obj.DescripcionCorta) + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodTipoProducto=N'" + SqlTexto(Obj.CodTipoProducto) + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM TipoProducto WHERE CodTipoProducto=N'" + SqlTexto(Obj.CodTipoProducto) + "'";
                case TipoDAL.Listado:
                    return "SELECT A.[CodTipoProducto],A.[Descripcion],A.[DescripcionCorta] FROM TipoProducto A ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodTipoProducto],A.[Descripcion] FROM TipoProducto A ";
                case TipoDAL.Obtener:
                    return "SELECT A.[CodTipoProducto],A.[Descripcion],A.[DescripcionCorta] FROM TipoProducto A " +
                           "WHERE A.[CodTipoProducto]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM TipoProducto A "
                        + "WHERE A.[Descripcion]=N'" + SqlTexto(Obj.Descripcion) + "' "
                        + "AND A.[CodTipoProducto] <> N'" + SqlTexto(Obj.CodTipoProducto) + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM TipoProducto_LOG UNION ALL SELECT * FROM TipoProducto) A " +
                        "WHERE A.[CodTipoProducto]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodTipoProducto], A.[Descripcion], A.[DescripcionCorta],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                      + "FROM (SELECT * FROM TipoProducto_LOG UNION ALL SELECT * FROM TipoProducto) A "
                      + "WHERE A.[CodTipoProducto] = N'" + SqlTexto(CodKey) + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codTipoProducto"] = "A.[CodTipoProducto]",
                ["descripcion"] = "A.[Descripcion]",
                ["descripcioncorta"] = "A.[DescripcionCorta]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "A.[CodTipoProducto]",
                    "A.[Descripcion]",
                    "A.[DescripcionCorta]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodTipoProducto] ASC");

            return "SELECT A.[CodTipoProducto],A.[Descripcion],A.[DescripcionCorta], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM TipoProducto A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }
        private TipoProductoDTO MapTipoProducto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TipoProductoDTO Obj = new TipoProductoDTO();
            Obj.CodTipoProducto = reader["CodTipoProducto"].ToString() ?? "";
            Obj.IdTipoProducto = ObjEncriptacion.Encriptar(Obj.CodTipoProducto);
            Obj.Descripcion = reader["Descripcion"].ToString() ?? "";
            Obj.DescripcionCorta = reader["DescripcionCorta"].ToString() ?? "";
            return Obj;
        }

        private TipoProductoDTO MapTipoProductoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TipoProductoDTO Obj = MapTipoProducto(reader);
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

        private MsjDB ValidarCodigoTipoProducto(TipoProductoDTO Obj)
        {
            Obj.CodTipoProducto = (Obj.CodTipoProducto ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodTipoProducto))
                return Error("El codigo de tipo de producto es requerido.");

            if (Obj.CodTipoProducto.Length > 20)
                return Error("El codigo de tipo de producto debe tener maximo 20 caracteres.");

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





