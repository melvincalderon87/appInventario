using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace app.Models.Personal
{
    /// <summary>Acceso a datos del modulo Personal.</summary>
    internal class PersonalDAO
    {
        private const int MaxFotoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private static readonly HashSet<string> TiposFotoPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png"
        };

        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<PersonalDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<PersonalDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapPersonal(reader);
            });

            return new PaginacionResultado<PersonalDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Nombre"].ToString(),
                Value = reader["CodPersonal"].ToString()
            });
        }

        internal List<SelectListItem> ListarTecnicos()
        {
            return ObjDAL.EjecutarReader(QueryListarTecnicos(), reader => new SelectListItem()
            {
                Text = reader["Nombre"].ToString(),
                Value = reader["CodPersonal"].ToString()
            });
        }

        internal PersonalDTO Obtener(int CodPersonal)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodPersonal), MapPersonal).FirstOrDefault() ?? new PersonalDTO();
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(PersonalDTO Obj)
        {
            Obj.CodPersonal = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionFoto = PrepararFoto(Obj);
            if (!validacionFoto.Estatus)
                return validacionFoto;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Personal", "CREADO", "CodPersonal:" + Obj.CodPersonal, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(PersonalDTO Obj)
        {
            PersonalDTO ObjAnterior = Obtener(Obj.CodPersonal);
            Obj.Version = ObtenerVersion(Obj.CodPersonal);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionFoto = PrepararFoto(Obj);
            if (!validacionFoto.Estatus)
                return validacionFoto;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Personal", "EDITADO", "CodPersonal:" + Obj.CodPersonal, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(PersonalDTO Obj)
        {
            PersonalDTO ObjAnterior = Obtener(Obj.CodPersonal);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Personal", "CodPersonal", Obj.CodPersonal);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Personal", "ELIMINADO", "CodPersonal:" + Obj.CodPersonal, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarPersonal(PersonalDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodPersonal)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodPersonal), 1);
        }

        internal List<PersonalDTO> Log(int CodPersonal)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodPersonal), MapPersonalLog);
        }

        internal byte[] LeerFoto(PersonalDTO personal)
        {
            if (string.IsNullOrWhiteSpace(personal.FotoRutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(personal.FotoRutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, PersonalDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Personal (CodPersonal,CodTecnico,Nombre,Puesto,EsTecnico,"
                            + "FotoNombreArchivo,FotoTipoContenido,FotoTamanoBytes,FotoRutaArchivo,Estatus,Version,CodUsuarioCreacion,FechaCreacion) "
                            + "VALUES('"
                            + Obj.CodPersonal + "',N'"
                            + SqlTexto(Obj.CodTecnico) + "',N'"
                            + SqlTexto(Obj.Nombre) + "',N'"
                            + SqlTexto(Obj.Puesto) + "','"
                            + (Obj.EsTecnico ? "1" : "0") + "',"
                            + SqlNulo(Obj.FotoNombreArchivo) + ","
                            + SqlNulo(Obj.FotoTipoContenido) + ","
                            + Obj.FotoTamanoBytes + ","
                            + SqlNulo(Obj.FotoRutaArchivo) + ",'"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "',N'"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',GETDATE())";
                case TipoDAL.Editar:
                    return "UPDATE Personal SET "
                            + "CodTecnico=N'" + SqlTexto(Obj.CodTecnico) + "',"
                            + "Nombre=N'" + SqlTexto(Obj.Nombre) + "',"
                            + "Puesto=N'" + SqlTexto(Obj.Puesto) + "',"
                            + "EsTecnico='" + (Obj.EsTecnico ? "1" : "0") + "',"
                            + "FotoNombreArchivo=" + SqlNulo(Obj.FotoNombreArchivo) + ","
                            + "FotoTipoContenido=" + SqlNulo(Obj.FotoTipoContenido) + ","
                            + "FotoTamanoBytes=" + Obj.FotoTamanoBytes + ","
                            + "FotoRutaArchivo=" + SqlNulo(Obj.FotoRutaArchivo) + ","
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodPersonal='" + Obj.CodPersonal + "'";
                case TipoDAL.Eliminar:
                    return "DELETE FROM Personal WHERE CodPersonal='" + Obj.CodPersonal + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodPersonal],A.[Nombre] FROM Personal A WHERE ISNULL(A.[Estatus], 1)=1 ORDER BY A.[Nombre] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodPersonal]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodPersonal]),0)+1 as 'CodPersonal' FROM Personal A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Personal A "
                        + "WHERE A.[CodTecnico]=N'" + SqlTexto(Obj.CodTecnico) + "' "
                        + "AND A.[CodTecnico] <> N'' "
                        + "AND A.[CodPersonal] <> '" + Obj.CodPersonal + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Personal_LOG UNION ALL SELECT * FROM Personal) A "
                        + "WHERE A.[CodPersonal]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodPersonal],A.[CodTecnico],A.[Nombre],A.[Puesto],A.[EsTecnico],"
                      + "A.[FotoNombreArchivo],A.[FotoTipoContenido],A.[FotoTamanoBytes],A.[FotoRutaArchivo],"
                      + "A.[Estatus],A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (SELECT * FROM Personal_LOG UNION ALL SELECT * FROM Personal) A "
                      + "WHERE A.[CodPersonal] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodPersonal],A.[CodTecnico],A.[Nombre],A.[Puesto],A.[EsTecnico],"
                + "A.[FotoNombreArchivo],A.[FotoTipoContenido],A.[FotoTamanoBytes],A.[FotoRutaArchivo],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM Personal A ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codPersonal"] = "A.[CodPersonal]",
                ["codTecnico"] = "A.[CodTecnico]",
                ["nombre"] = "A.[Nombre]",
                ["puesto"] = "A.[Puesto]",
                ["esTecnico"] = "A.[EsTecnico]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodPersonal])",
                    "A.[CodTecnico]",
                    "A.[Nombre]",
                    "A.[Puesto]",
                    "CONVERT(VARCHAR(5), A.[EsTecnico])",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodPersonal] ASC");

            return "SELECT A.[CodPersonal],A.[CodTecnico],A.[Nombre],A.[Puesto],A.[EsTecnico],"
                + "A.[FotoNombreArchivo],A.[FotoTipoContenido],A.[FotoTamanoBytes],A.[FotoRutaArchivo],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Personal A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryListarTecnicos()
        {
            return "SELECT A.[CodPersonal],A.[Nombre] "
                + "FROM Personal A "
                + "WHERE ISNULL(A.[Estatus], 1)=1 AND ISNULL(A.[EsTecnico], 0)=1 "
                + "ORDER BY A.[Nombre] ";
        }

        private MsjDB PrepararFoto(PersonalDTO Obj)
        {
            Obj.CodTecnico = (Obj.CodTecnico ?? "").Trim();
            Obj.Nombre = (Obj.Nombre ?? "").Trim();
            Obj.Puesto = (Obj.Puesto ?? "").Trim();
            Obj.FotoNombreArchivo = Path.GetFileName((Obj.FotoNombreArchivo ?? "").Trim());
            Obj.FotoTipoContenido = NormalizarTipoContenido(Obj.FotoTipoContenido, Obj.FotoNombreArchivo);
            Obj.FotoRutaArchivo = (Obj.FotoRutaArchivo ?? "").Trim();
            Obj.FotoContenidoBase64 = NormalizarContenidoBase64(Obj.FotoContenidoBase64);

            if (Obj.FotoEliminar)
            {
                Obj.FotoNombreArchivo = "";
                Obj.FotoTipoContenido = "";
                Obj.FotoTamanoBytes = 0;
                Obj.FotoRutaArchivo = "";
                Obj.FotoContenidoBase64 = "";
                return Ok();
            }

            if (string.IsNullOrWhiteSpace(Obj.FotoContenidoBase64))
            {
                if (string.IsNullOrWhiteSpace(Obj.FotoRutaArchivo))
                {
                    Obj.FotoNombreArchivo = "";
                    Obj.FotoTipoContenido = "";
                    Obj.FotoTamanoBytes = 0;
                }

                return Ok();
            }

            if (string.IsNullOrWhiteSpace(Obj.FotoNombreArchivo))
                return Error("El nombre de la foto es requerido.");

            if (Obj.FotoNombreArchivo.Length > 260)
                return Error("El nombre de la foto debe tener maximo 260 caracteres.");

            if (Obj.FotoTipoContenido.Length > 150)
                return Error("El tipo de contenido de la foto debe tener maximo 150 caracteres.");

            if (!app.ArchivoPermitido.MetadataImagenPermitida(Obj.FotoNombreArchivo, Obj.FotoTipoContenido))
                return Error("Solo se permiten imagenes .jpg, .jpeg o .png para la foto del personal.");

            byte[] contenido;
            try
            {
                contenido = Convert.FromBase64String(Obj.FotoContenidoBase64);
            }
            catch (FormatException)
            {
                return Error("La foto no tiene un formato valido.");
            }

            if (contenido.LongLength <= 0)
                return Error("La foto es requerida.");

            if (contenido.LongLength > MaxFotoBytes)
                return Error("La foto debe pesar maximo 10 MB.");

            if (!app.ArchivoPermitido.FirmaContenidoValida(Obj.FotoTipoContenido, contenido))
                return Error("La foto no coincide con el tipo permitido.");

            Obj.FotoTamanoBytes = contenido.LongLength;
            Obj.FotoRutaArchivo = GuardarFotoFisica(Obj.CodPersonal, Obj, contenido);
            Obj.FotoContenidoBase64 = "";
            return Ok();
        }

        private string GuardarFotoFisica(int CodPersonal, PersonalDTO Obj, byte[] contenido)
        {
            string carpeta = CarpetaPersonal(CodPersonal);
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionPermitida(Obj.FotoNombreArchivo, Obj.FotoTipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(Obj.FotoNombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string nombreArchivo = "PER" + CodPersonal + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "Personal", "PER" + CodPersonal, nombreArchivo);
        }

        private string CarpetaPersonal(int CodPersonal)
        {
            return Path.Combine(CarpetaRaizPersonal(), "PER" + CodPersonal);
        }

        private string CarpetaRaizPersonal()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "Personal");
        }

        private string RutaAbsolutaDesdeRelativa(string rutaRelativa)
        {
            string raiz = Path.GetFullPath(CarpetaRaizPersonal());
            string ruta = rutaRelativa.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
            string completa = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ruta));

            if (!completa.Equals(raiz, StringComparison.OrdinalIgnoreCase)
                && !completa.StartsWith(raiz + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                return "";

            return completa;
        }

        private string NombreArchivoSeguro(string nombre)
        {
            string limpio = string.IsNullOrWhiteSpace(nombre) ? "foto" : nombre.Trim();

            foreach (char caracter in Path.GetInvalidFileNameChars())
            {
                limpio = limpio.Replace(caracter, '_');
            }

            if (limpio.Length > 120)
                limpio = limpio.Substring(0, 120);

            return string.IsNullOrWhiteSpace(limpio) ? "foto" : limpio;
        }

        private string ExtensionPermitida(string nombreArchivo, string tipoContenido)
        {
            return app.ArchivoPermitido.ExtensionPermitida(nombreArchivo, tipoContenido, permitirPdf: false);
        }

        private string NormalizarTipoContenido(string? tipoContenido, string nombreArchivo)
        {
            return app.ArchivoPermitido.NormalizarTipoContenido(tipoContenido, nombreArchivo, permitirPdf: false);
        }

        private string NormalizarContenidoBase64(string? contenido)
        {
            return app.ArchivoPermitido.NormalizarContenidoBase64(contenido);
        }

        private bool TipoFotoPermitido(string tipoContenido)
        {
            return app.ArchivoPermitido.TipoContenidoPermitido(tipoContenido, permitirPdf: false);
        }

        private PersonalDTO MapPersonal(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            PersonalDTO Obj = new PersonalDTO();
            Obj.CodPersonal = Convert.ToInt32(reader["CodPersonal"]);
            Obj.IdPersonal = ObjEncriptacion.Encriptar(Obj.CodPersonal.ToString());
            Obj.CodTecnico = reader["CodTecnico"].ToString() ?? "";
            Obj.Nombre = reader["Nombre"].ToString() ?? "";
            Obj.Puesto = reader["Puesto"].ToString() ?? "";
            Obj.EsTecnico = reader["EsTecnico"] != DBNull.Value && Convert.ToBoolean(reader["EsTecnico"]);
            Obj.FotoNombreArchivo = reader["FotoNombreArchivo"].ToString() ?? "";
            Obj.FotoTipoContenido = reader["FotoTipoContenido"].ToString() ?? "";
            Obj.FotoTamanoBytes = reader["FotoTamanoBytes"] == DBNull.Value ? 0 : Convert.ToInt64(reader["FotoTamanoBytes"]);
            Obj.FotoRutaArchivo = reader["FotoRutaArchivo"].ToString() ?? "";
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private PersonalDTO MapPersonalLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            PersonalDTO Obj = MapPersonal(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
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

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string SqlNulo(string? valor)
        {
            return string.IsNullOrWhiteSpace(valor) ? "NULL" : "N'" + SqlTexto(valor) + "'";
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
