using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Socio
{
    /// <summary>
    /// DAO para el mantenimiento de socios.
    /// </summary>
    internal class SocioDAO
    {
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<SocioDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<SocioDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapSocio(reader);
            });

            return new PaginacionResultado<SocioDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Socio"].ToString(),
                Value = reader["CodSocio"].ToString()
            });
        }

        internal SocioDTO Obtener(string CodSocio)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodSocio), MapSocio).FirstOrDefault() ?? new SocioDTO();
        }

        internal MsjDB Agregar(SocioDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoSocio(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Socio", "CREADO", "CodSocio:" + Obj.CodSocio, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(SocioDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoSocio(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            SocioDTO ObjAnterior = Obtener(Obj.CodSocio);
            Obj.Version = ObtenerVersion(Obj.CodSocio);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Socio", "EDITADO", "CodSocio:" + Obj.CodSocio, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(SocioDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoSocio(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            SocioDTO ObjAnterior = Obtener(Obj.CodSocio);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Socio", "CodSocio", Obj.CodSocio);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Socio", "ELIMINADO", "CodSocio:" + Obj.CodSocio, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarSocio(SocioDTO Obj)
        {
            Obj.CodSocio = (Obj.CodSocio ?? "").Trim();
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(string CodSocio)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodSocio), 1);
        }

        internal List<SocioDTO> Log(string CodSocio)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodSocio), MapSocioLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", SocioDTO? Obj = null)
        {
            SocioDTO obj = Obj ?? new SocioDTO();
            if (obj.CodSocio == null) obj.CodSocio = "";
            if (obj.Socio == null) obj.Socio = "";
            if (obj.NombreCortoSocio == null) obj.NombreCortoSocio = "";
            if (obj.CodUsuarioCreacion == null) obj.CodUsuarioCreacion = "";
            if (obj.CodUsuarioActualizacion == null) obj.CodUsuarioActualizacion = "";
            obj.CodSocio = obj.CodSocio.Trim();

            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Socio (CodSocio,Socio,NombreCortoSocio,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES(N'"
                            + SqlTexto(obj.CodSocio) + "',N'"
                            + SqlTexto(obj.Socio) + "',N'"
                            + SqlTexto(obj.NombreCortoSocio) + "','"
                            + (obj.Estatus ? "1" : "0") + "','"
                            + obj.Version + "',N'"
                            + SqlTexto(obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Socio SET "
                            + "Socio=N'" + SqlTexto(obj.Socio) + "',"
                            + "NombreCortoSocio=N'" + SqlTexto(obj.NombreCortoSocio) + "',"
                            + "Estatus='" + (obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodSocio=N'" + SqlTexto(obj.CodSocio) + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM Socio WHERE CodSocio=N'" + SqlTexto(obj.CodSocio) + "'";
                case TipoDAL.Listado:
                    return "SELECT A.[CodSocio],A.[Socio],A.[NombreCortoSocio],ISNULL(A.[Estatus], 1) AS [Estatus] FROM Socio A ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodSocio],A.[Socio] FROM Socio A WHERE ISNULL(A.[Estatus], 1)=1 ORDER BY A.[Socio] ";
                case TipoDAL.Obtener:
                    return "SELECT A.[CodSocio],A.[Socio],A.[NombreCortoSocio],ISNULL(A.[Estatus], 1) AS [Estatus] FROM Socio A "
                           + "WHERE A.[CodSocio]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Socio A "
                        + "WHERE A.[Socio]=N'" + SqlTexto(obj.Socio) + "' "
                        + "AND A.[CodSocio] <> N'" + SqlTexto(obj.CodSocio) + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Socio_LOG UNION ALL SELECT * FROM Socio) A "
                        + "WHERE A.[CodSocio]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodSocio],A.[Socio],A.[NombreCortoSocio],A.[Estatus],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (SELECT * FROM Socio_LOG UNION ALL SELECT * FROM Socio) A "
                      + "WHERE A.[CodSocio] = N'" + SqlTexto(CodKey) + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codSocio"] = "A.[CodSocio]",
                ["socio"] = "A.[Socio]",
                ["nombrecortosocio"] = "A.[NombreCortoSocio]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodSocio])",
                    "A.[Socio]",
                    "A.[NombreCortoSocio]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodSocio] ASC");

            return "SELECT A.[CodSocio],A.[Socio],A.[NombreCortoSocio],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Socio A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private SocioDTO MapSocio(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            SocioDTO Obj = new SocioDTO();
            Obj.CodSocio = reader["CodSocio"]?.ToString() ?? "";
            Obj.IdSocio = ObjEncriptacion.Encriptar(Obj.CodSocio);
            Obj.Socio = reader["Socio"].ToString() ?? "";
            Obj.NombreCortoSocio = reader["NombreCortoSocio"].ToString() ?? "";
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private SocioDTO MapSocioLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            SocioDTO Obj = MapSocio(reader);
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

        private MsjDB ValidarCodigoSocio(SocioDTO Obj)
        {
            Obj.CodSocio = (Obj.CodSocio ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodSocio))
                return Error("El codigo de socio es requerido.");

            if (Obj.CodSocio.Length > 20)
                return Error("El codigo de socio debe tener maximo 20 caracteres.");

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
