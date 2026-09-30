
using app.Models.Menu;
using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;

namespace app.Models.Usuarios
{
    /// <summary>
    /// 
    /// </summary>
    internal class UsuarioDAO
    {
        private UsuarioDTO Obj = new UsuarioDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();
        internal bool Autenticarse(Login Login_)
        {
            try
            {
                UsuarioDTO Obj = ObjDAL.EjecutarReader(Query(TipoDAL: TipoDAL.Obtener, CodKey: Login_.CodUsuario), MapUsuarioCompleto).FirstOrDefault() ?? new UsuarioDTO();

                string Password = ObjEncriptacion.EncriptarHex(Login_.Password);
                //string Password = Login_.Password;
                if (Obj.CodUsuario == Login_.CodUsuario && Obj.Password == Password && Obj.Estatus == true)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
            catch (Exception)
            {
                return false;
            }
        }
        internal MsjDB ActualizarPassword(string CodUsuario, string Password)
        {
            Encriptacion ObjEncriptacion = new Encriptacion();
            VerificarUsuario ObjVerificarUsuario = new VerificarUsuario();
            int Version = ObtenerVersion(CodUsuario);
            string CodUsuarioActualizacion = ObjVerificarUsuario.SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL: TipoDAL.Editar, CodKey: CodUsuario,
           Password: ObjEncriptacion.EncriptarHex(Password), Version: Version, CodUsuarioActualizacion: CodUsuarioActualizacion), Key: false, tipoOperacion: app.Messages.TipoOperacion.Password);
            if (MsjDB.Estatus == true)
            {
                RegistrarLog("Editar", "CodUsuario:" + CodUsuario, "Actualizacion de password");
            }
            return MsjDB;
        }
        internal UsuarioDTO Obtener(string CodUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL: TipoDAL.Obtener, CodKey: CodUsuario), MapUsuarioCompleto).FirstOrDefault() ?? new UsuarioDTO();
        }
        internal PaginacionResultado<UsuarioDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<UsuarioDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                UsuarioDTO Obj = new UsuarioDTO();
                Obj.CodUsuario = reader["CodUsuario"].ToString();
                Obj.IdUsuario = ObjEncriptacion.Encriptar(Obj.CodUsuario.ToString());
                Obj.Nombre = reader["Nombre"].ToString();
                Obj.Correo = reader["Correo"].ToString();
                Obj.Estatus = Convert.ToBoolean(reader["Estatus"].ToString());
                return Obj;
            });

            return new PaginacionResultado<UsuarioDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }
        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Nombre"].ToString(),
                Value = reader["CodUsuario"].ToString()
            });
        }
        internal List<UsuarioExportacionDTO> ListadoExportacion(string search = "", string sort = "")
        {
            return ObjDAL.EjecutarReader(QueryListadoExportacion(search, sort), MapUsuarioExportacion);
        }
        internal MsjDB Agregar(UsuarioDTO Obj)
        {
            Obj.Password = ObjEncriptacion.EncriptarHex(Obj.Password); Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);
            if (MsjDB.Estatus == true)
            {
                string Llave = "CodUsuario:" + Obj.CodUsuario;
                RegistrarLog("Agregar", Llave, Nuevo: Obj);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal MsjDB Editar(UsuarioDTO Obj)
        {
            UsuarioDTO ObjAnterior = Obtener(Obj.CodUsuario);
            Obj.Password = ObjEncriptacion.EncriptarHex(Obj.Password);
            Obj.Version = ObtenerVersion(Obj.CodUsuario);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            UsuarioDTO ObjNuevo = Obj;
            string Llave = "CodUsuario:" + Obj.CodUsuario;
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);
            if (MsjDB.Estatus == true)
            {
                RegistrarLog("Editar", Llave, Anterior: ObjAnterior, Nuevo: ObjNuevo);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal MsjDB Eliminar(UsuarioDTO Obj)
        {
            UsuarioDTO ObjAnterior = Obtener(Obj.CodUsuario);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Usuario", "CodUsuario", Obj.CodUsuario);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB limpiezaSuplidores = new app.Models.UsuarioSuplidores.UsuarioSuplidorDAO().EliminarPorUsuario(Obj.CodUsuario);
            if (!limpiezaSuplidores.Estatus)
                return limpiezaSuplidores;

            string Llave = "CodUsuario:" + Obj.CodUsuario;
            Obj.Version = ObtenerVersion(Obj.CodUsuario);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);
            if (MsjDB.Estatus == true)
            {
                RegistrarLog("Eliminar", Llave, Anterior: ObjAnterior);
                return MsjDB;
            }
            else
            {
                return MsjDB;
            }
        }
        internal int ObtenerVersion(string CodUsuario)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodUsuario), 1);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        internal List<UsuarioDTO> Log(string CodUsuario)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodUsuario), MapUsuarioLog);
        }

        private void RegistrarLog(string Accion, string Llave, string Descripcion = "", UsuarioDTO? Anterior = null, UsuarioDTO? Nuevo = null)
        {
            try
            {
                LogModificacionDAO ObjLogModificacion = new LogModificacionDAO();
                ObjLogModificacion.Agregar("Usuario", Accion, Llave, Descripcion, Anterior, Nuevo);
            }
            catch
            {
            }
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", string Password = "",
        UsuarioDTO Obj = null, int Version = 0, string CodUsuarioActualizacion = "")
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Usuario (CodUsuario,Nombre,Correo,Password,Estatus,Version," +
                        "CodUsuarioCreacion,FechaCreacion) Values('"
                        + Obj.CodUsuario + "','"
                        + Obj.Nombre + "','"
                        + Obj.Correo + "','"
                        + Obj.Password + "','"
                        + Obj.Estatus + "','"
                        + Obj.Version + "','"
                        + Obj.CodUsuarioCreacion + "',"
                        + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    if (Password != "")
                    {
                        return "UPDATE Usuario SET " +
                            "Password='" + Password + "',"
                            + "Version=" + Version + ","
                            + "CodUsuarioActualizacion='" + CodUsuarioActualizacion + "',"
                            + "FechaActualizacion=GETDATE() "
                            + " WHERE CodUsuario=lower('" + CodKey + "')";
                    }
                    else
                    {
                        return "UPDATE Usuario SET "
                            + "Nombre='" + Obj.Nombre + "',"
                            + "Correo='" + Obj.Correo + "',"
                            + "Estatus='" + Obj.Estatus + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + Obj.CodUsuarioActualizacion + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodUsuario=lower('" + Obj.CodUsuario + "')";
                    }
                case TipoDAL.Eliminar:
                    return "DELETE FROM Usuario WHERE CodUsuario='" + Obj.CodUsuario + "'";
                case TipoDAL.Listado:
                    return "SELECT A.[CodUsuario],A.[Nombre],A.[Correo],A.[Estatus] FROM Usuario A ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodUsuario],A.[Nombre] FROM Usuario A WHERE A.[Estatus]='1'";
                case TipoDAL.Obtener:
                    return "SELECT A.[CodUsuario], A.[Nombre],A.[Correo],A.[Password],A.[Estatus] FROM Usuario A "
                        + "WHERE A.[Codusuario]=lower('" + CodKey + "')";
                case TipoDAL.Log:
                    return "SELECT "
                      + "A.[CodUsuario], A.[Nombre],A.[Correo],A.[Password],A.[Estatus],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                      + "FROM (SELECT * FROM Usuario_LOG UNION ALL SELECT * FROM Usuario) A "
                      + "WHERE A.[Codusuario]=lower('" + CodKey + "') "
                      + "ORDER BY A.Version DESC ";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Usuario_LOG UNION ALL SELECT * FROM Usuario) A " +
                        "WHERE A.[Codusuario]=lower('" + CodKey + "')";
                default:
                    return "";
            }
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codUsuario"] = "A.[CodUsuario]",
                ["nombre"] = "A.[Nombre]",
                ["correo"] = "A.[Correo]",
                ["estatus"] = "A.[Estatus]"
            };

            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "A.[CodUsuario]",
                    "A.[Nombre]",
                    "A.[Correo]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodUsuario] ASC");

            return "SELECT A.[CodUsuario],A.[Nombre],A.[Correo],A.[Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Usuario A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }
        private string QueryListadoExportacion(string search = "", string sort = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codUsuario"] = "A.[CodUsuario]",
                ["nombre"] = "A.[Nombre]",
                ["correo"] = "A.[Correo]",
                ["estatus"] = "A.[Estatus]"
            };

            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(search, new[]
                {
                    "A.[CodUsuario]",
                    "A.[Nombre]",
                    "A.[Correo]",
                    "CONVERT(VARCHAR(5), A.[Estatus])",
                    "ISNULL(TU.[Descripcion], '')",
                    "ISNULL(R.[Descripcion], '')",
                    "ISNULL(UP.[Idioma], '')",
                    "ISNULL(UP.[Theme], '')"
                });
            string orderBy = PaginacionSql.OrderBy(sort, sortColumns, "A.[CodUsuario] ASC");

            return "SELECT A.[CodUsuario], A.[Nombre], A.[Correo], A.[Estatus], "
                + "ISNULL(TU.[Descripcion], '') AS [TipoUsuario], "
                + "ISNULL(R.[Descripcion], '') AS [Rol], "
                + "ISNULL(UP.[Idioma], '') AS [Idioma], "
                + "ISNULL(UP.[Theme], '') AS [Theme] "
                + "FROM Usuario A "
                + "LEFT JOIN UsuarioConfiguracion UC ON A.[CodUsuario] = UC.[CodUsuario] "
                + "LEFT JOIN TipoUsuario TU ON UC.[CodTipoUsuario] = TU.[CodTipoUsuario] "
                + "LEFT JOIN Rol R ON UC.[CodRol] = R.[CodRol] "
                + "LEFT JOIN UsuarioPreferencia UP ON A.[CodUsuario] = UP.[CodUsuario] "
                + where
                + "ORDER BY " + orderBy;
        }
        private UsuarioDTO MapUsuarioCompleto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            UsuarioDTO Obj = new UsuarioDTO();
            Obj.CodUsuario = reader["CodUsuario"].ToString();
            Obj.IdUsuario = ObjEncriptacion.Encriptar(Obj.CodUsuario.ToString());
            Obj.Nombre = reader["Nombre"].ToString();
            Obj.Correo = reader["Correo"].ToString();
            Obj.Estatus = Convert.ToBoolean(reader["Estatus"].ToString());
            Obj.Password = reader["Password"].ToString();
            return Obj;
        }

        private UsuarioDTO MapUsuarioLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            UsuarioDTO Obj = MapUsuarioCompleto(reader);
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

        private UsuarioExportacionDTO MapUsuarioExportacion(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            return new UsuarioExportacionDTO
            {
                CodUsuario = reader["CodUsuario"].ToString() ?? "",
                Nombre = reader["Nombre"].ToString() ?? "",
                Correo = reader["Correo"].ToString() ?? "",
                Estatus = Convert.ToBoolean(reader["Estatus"].ToString()),
                TipoUsuario = reader["TipoUsuario"].ToString() ?? "",
                Rol = reader["Rol"].ToString() ?? "",
                Idioma = reader["Idioma"].ToString() ?? "",
                Theme = reader["Theme"].ToString() ?? "",
            };
        }
    }
}




