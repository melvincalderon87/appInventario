using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace app.Models.CompaniaInspeccion
{
    /// <summary>Acceso a datos del modulo CompaniaInspeccion.</summary>
    internal class CompaniaInspeccionDAO
    {
        private const int MaxAdjuntos = app.ArchivoPermitido.MaxAdjuntos;
        private const int MaxAdjuntoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private static readonly HashSet<string> TiposAdjuntosPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "image/jpeg",
            "image/png"
        };

        private readonly DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<CompaniaInspeccionDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<CompaniaInspeccionDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapCompaniaInspeccion(reader);
            });

            return new PaginacionResultado<CompaniaInspeccionDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["NombreComercial"].ToString(),
                Value = reader["CodCompaniaInspeccion"].ToString()
            });
        }

        internal CompaniaInspeccionDTO Obtener(int CodCompaniaInspeccion)
        {
            CompaniaInspeccionDTO companiaInspeccion = ObjDAL
                .EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodCompaniaInspeccion), MapCompaniaInspeccion)
                .FirstOrDefault()
                ?? new CompaniaInspeccionDTO();

            if (companiaInspeccion.CodCompaniaInspeccion > 0)
            {
                companiaInspeccion.Adjuntos = ListarAdjuntos(companiaInspeccion.CodCompaniaInspeccion);
                companiaInspeccion.AdjuntoCantidad = companiaInspeccion.Adjuntos.Count;
            }

            return companiaInspeccion;
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(CompaniaInspeccionDTO Obj)
        {
            Normalizar(Obj);
            Obj.CodCompaniaInspeccion = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                MsjDB.Key = Obj.CodCompaniaInspeccion;
                LogModificacionDAO.Registrar("CompaniaInspeccion", "CREADO", "CodCompaniaInspeccion:" + Obj.CodCompaniaInspeccion, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(CompaniaInspeccionDTO Obj)
        {
            Normalizar(Obj);
            CompaniaInspeccionDTO ObjAnterior = Obtener(Obj.CodCompaniaInspeccion);
            Obj.Version = ObtenerVersion(Obj.CodCompaniaInspeccion);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("CompaniaInspeccion", "EDITADO", "CodCompaniaInspeccion:" + Obj.CodCompaniaInspeccion, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(CompaniaInspeccionDTO Obj)
        {
            CompaniaInspeccionDTO ObjAnterior = Obtener(Obj.CodCompaniaInspeccion);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("CompaniaInspeccion", "CodCompaniaInspeccion", Obj.CodCompaniaInspeccion);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CompaniaInspeccion", "ELIMINADO", "CodCompaniaInspeccion:" + Obj.CodCompaniaInspeccion, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarCompaniaInspeccion(CompaniaInspeccionDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodCompaniaInspeccion)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodCompaniaInspeccion), 1);
        }

        internal List<CompaniaInspeccionDTO> Log(int CodCompaniaInspeccion)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodCompaniaInspeccion), MapCompaniaInspeccionLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, CompaniaInspeccionDTO? Obj = null)
        {
            CompaniaInspeccionDTO obj = Obj ?? new CompaniaInspeccionDTO();

            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO CompaniaInspeccion (CodCompaniaInspeccion,NombreComercial,NombreFiscal,Nit,Estatus,Version,CodUsuarioCreacion,FechaCreacion) "
                            + "VALUES('"
                            + obj.CodCompaniaInspeccion + "',N'"
                            + SqlTexto(obj.NombreComercial) + "',N'"
                            + SqlTexto(obj.NombreFiscal) + "',N'"
                            + SqlTexto(obj.Nit) + "','"
                            + (obj.Estatus ? "1" : "0") + "','"
                            + obj.Version + "',N'"
                            + SqlTexto(obj.CodUsuarioCreacion) + "',GETDATE())";
                case TipoDAL.Editar:
                    return "UPDATE CompaniaInspeccion SET "
                            + "NombreComercial=N'" + SqlTexto(obj.NombreComercial) + "',"
                            + "NombreFiscal=N'" + SqlTexto(obj.NombreFiscal) + "',"
                            + "Nit=N'" + SqlTexto(obj.Nit) + "',"
                            + "Estatus='" + (obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodCompaniaInspeccion='" + obj.CodCompaniaInspeccion + "'";
                case TipoDAL.Eliminar:
                    return "IF OBJECT_ID('dbo.CompaniaInspeccionAdjunto', 'U') IS NOT NULL "
                            + "DELETE FROM dbo.CompaniaInspeccionAdjunto "
                            + "WHERE CodCompaniaInspeccionArchivo='" + obj.CodCompaniaInspeccion + "'; "
                            + "DELETE FROM CompaniaInspeccion WHERE CodCompaniaInspeccion='" + obj.CodCompaniaInspeccion + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodCompaniaInspeccion],A.[NombreComercial] FROM CompaniaInspeccion A WHERE ISNULL(A.[Estatus], 1)=1 ORDER BY A.[NombreComercial] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodCompaniaInspeccion]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodCompaniaInspeccion]),0)+1 as 'CodCompaniaInspeccion' FROM CompaniaInspeccion A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM CompaniaInspeccion A "
                        + "WHERE A.[Nit]=N'" + SqlTexto(obj.Nit) + "' "
                        + "AND A.[CodCompaniaInspeccion] <> '" + obj.CodCompaniaInspeccion + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM CompaniaInspeccion_LOG UNION ALL SELECT * FROM CompaniaInspeccion) A "
                        + "WHERE A.[CodCompaniaInspeccion]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodCompaniaInspeccion],A.[NombreComercial],A.[NombreFiscal],A.[Nit],A.[Estatus],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (SELECT * FROM CompaniaInspeccion_LOG UNION ALL SELECT * FROM CompaniaInspeccion) A "
                      + "WHERE A.[CodCompaniaInspeccion] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodCompaniaInspeccion],A.[NombreComercial],A.[NombreFiscal],A.[Nit],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM CompaniaInspeccion A ";
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codCompaniaInspeccion"] = "A.[CodCompaniaInspeccion]",
                ["nombreComercial"] = "A.[NombreComercial]",
                ["nombreFiscal"] = "A.[NombreFiscal]",
                ["nit"] = "A.[Nit]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodCompaniaInspeccion])",
                    "A.[NombreComercial]",
                    "A.[NombreFiscal]",
                    "A.[Nit]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodCompaniaInspeccion] ASC");

            return "SELECT A.[CodCompaniaInspeccion],A.[NombreComercial],A.[NombreFiscal],A.[Nit],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM CompaniaInspeccion A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        internal CompaniaInspeccionAdjuntoDTO ObtenerAdjunto(int CodCompaniaInspeccion, int CodCompaniaInspeccionAdjunto)
        {
            if (!ExisteTablaAdjuntos())
                return new CompaniaInspeccionAdjuntoDTO();

            return ObjDAL
                .EjecutarReader(QueryObtenerAdjunto(CodCompaniaInspeccion, CodCompaniaInspeccionAdjunto), MapAdjunto)
                .FirstOrDefault()
                ?? new CompaniaInspeccionAdjuntoDTO();
        }

        internal byte[] LeerArchivoAdjunto(CompaniaInspeccionAdjuntoDTO adjunto)
        {
            if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(adjunto.RutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        private List<CompaniaInspeccionAdjuntoDTO> ListarAdjuntos(int CodCompaniaInspeccion)
        {
            if (!ExisteTablaAdjuntos())
                return new List<CompaniaInspeccionAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(CodCompaniaInspeccion), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(CompaniaInspeccionDTO Obj)
        {
            Obj.Adjuntos ??= new List<CompaniaInspeccionAdjuntoDTO>();

            if (Obj.Adjuntos.Count == 0 && !ExisteTablaAdjuntos())
                return Ok();

            if (!ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de compania de inspeccion no existe.");

            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(CompaniaInspeccionDTO Obj)
        {
            Obj.Adjuntos ??= new List<CompaniaInspeccionAdjuntoDTO>();

            if (Obj.Adjuntos.Count > 0 && !ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de compania de inspeccion no existe.");

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("La compania de inspeccion puede tener maximo " + MaxAdjuntos + " archivos.");

            List<CompaniaInspeccionAdjuntoDTO> adjuntos = new List<CompaniaInspeccionAdjuntoDTO>();
            foreach (CompaniaInspeccionAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                if (adjunto == null)
                    continue;

                adjunto.NombreArchivo = Path.GetFileName((adjunto.NombreArchivo ?? "").Trim());
                adjunto.TipoContenido = NormalizarTipoAdjunto(adjunto.TipoContenido, adjunto.NombreArchivo);
                adjunto.RutaArchivo = (adjunto.RutaArchivo ?? "").Trim();
                adjunto.ContenidoBase64 = NormalizarContenidoBase64(adjunto.ContenidoBase64);

                bool vacio =
                    string.IsNullOrWhiteSpace(adjunto.NombreArchivo) &&
                    string.IsNullOrWhiteSpace(adjunto.RutaArchivo) &&
                    string.IsNullOrWhiteSpace(adjunto.ContenidoBase64);
                if (vacio)
                    continue;

                bool tieneContenido = !string.IsNullOrWhiteSpace(adjunto.ContenidoBase64);

                if (string.IsNullOrWhiteSpace(adjunto.NombreArchivo))
                    return Error("El nombre del archivo es requerido.");

                if (adjunto.NombreArchivo.Length > 260)
                    return Error("El nombre del archivo debe tener maximo 260 caracteres.");

                if (adjunto.TipoContenido.Length > 150)
                    return Error("El tipo de contenido debe tener maximo 150 caracteres.");

                if (tieneContenido && !app.ArchivoPermitido.MetadataAdjuntoPermitida(adjunto.NombreArchivo, adjunto.TipoContenido))
                    return Error("Solo se permiten archivos .pdf, .jpg, .jpeg o .png.");

                if (tieneContenido)
                {
                    byte[] contenido;
                    try
                    {
                        contenido = Convert.FromBase64String(adjunto.ContenidoBase64);
                    }
                    catch (FormatException)
                    {
                        return Error("El archivo no tiene un formato valido.");
                    }

                    if (contenido.LongLength <= 0)
                        return Error("El archivo es requerido.");

                    if (contenido.LongLength > MaxAdjuntoBytes)
                        return Error("Cada archivo debe pesar maximo 10 MB.");

                    if (!app.ArchivoPermitido.FirmaContenidoValida(adjunto.TipoContenido, contenido))
                        return Error("El archivo no coincide con el tipo permitido.");

                    adjunto.TamanoBytes = contenido.LongLength;
                    adjunto.RutaArchivo = GuardarArchivoAdjuntoFisico(Obj.CodCompaniaInspeccion, adjunto, contenido);
                    adjunto.ContenidoBase64 = "";
                }
                else if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                {
                    return Error("El archivo es requerido.");
                }

                adjunto.CodCompaniaInspeccion = Obj.CodCompaniaInspeccion;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.CompaniaInspeccionAdjunto')");
        }

        private string QueryListarAdjuntos(int CodCompaniaInspeccion)
        {
            return "SELECT CodCompaniaInspeccionAdjunto,CodCompaniaInspeccionArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.CompaniaInspeccionAdjunto "
                + "WHERE CodCompaniaInspeccionArchivo='" + CodCompaniaInspeccion + "' "
                + "ORDER BY CodCompaniaInspeccionAdjunto";
        }

        private string QueryObtenerAdjunto(int CodCompaniaInspeccion, int CodCompaniaInspeccionAdjunto)
        {
            return "SELECT CodCompaniaInspeccionAdjunto,CodCompaniaInspeccionArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.CompaniaInspeccionAdjunto "
                + "WHERE CodCompaniaInspeccionArchivo='" + CodCompaniaInspeccion + "' "
                + "AND CodCompaniaInspeccionAdjunto='" + CodCompaniaInspeccionAdjunto + "'";
        }

        private string QueryGuardarAdjuntos(CompaniaInspeccionDTO Obj)
        {
            string sql = "DELETE FROM dbo.CompaniaInspeccionAdjunto "
                + "WHERE CodCompaniaInspeccionArchivo='" + Obj.CodCompaniaInspeccion + "'; "
                + "DECLARE @CodCompaniaInspeccionAdjunto INT; ";

            foreach (CompaniaInspeccionAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.CompaniaInspeccionAdjunto'), 'CodCompaniaInspeccionAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.CompaniaInspeccionAdjunto "
                    + "(CodCompaniaInspeccionArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES('"
                    + Obj.CodCompaniaInspeccion + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodCompaniaInspeccionAdjunto = ISNULL(MAX(CodCompaniaInspeccionAdjunto), 0) + 1 "
                    + "FROM dbo.CompaniaInspeccionAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.CompaniaInspeccionAdjunto "
                    + "(CodCompaniaInspeccionAdjunto,CodCompaniaInspeccionArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(@CodCompaniaInspeccionAdjunto,'"
                    + Obj.CodCompaniaInspeccion + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END ";
            }

            return sql;
        }

        private string GuardarArchivoAdjuntoFisico(int CodCompaniaInspeccion, CompaniaInspeccionAdjuntoDTO adjunto, byte[] contenido)
        {
            string carpeta = CarpetaCompaniaInspeccion(CodCompaniaInspeccion);
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionAdjuntoPermitida(adjunto.NombreArchivo, adjunto.TipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(adjunto.NombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string nombreArchivo = "CI" + CodCompaniaInspeccion + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "CompaniaInspeccion", "CI" + CodCompaniaInspeccion, nombreArchivo);
        }

        private string CarpetaCompaniaInspeccion(int CodCompaniaInspeccion)
        {
            return Path.Combine(CarpetaRaizCompaniaInspeccion(), "CI" + CodCompaniaInspeccion);
        }

        private string CarpetaRaizCompaniaInspeccion()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "CompaniaInspeccion");
        }

        private string RutaAbsolutaDesdeRelativa(string rutaRelativa)
        {
            string raiz = Path.GetFullPath(CarpetaRaizCompaniaInspeccion());
            string ruta = rutaRelativa.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
            string completa = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ruta));

            if (!completa.Equals(raiz, StringComparison.OrdinalIgnoreCase)
                && !completa.StartsWith(raiz + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                return "";

            return completa;
        }

        private string NombreArchivoSeguro(string nombre)
        {
            string limpio = string.IsNullOrWhiteSpace(nombre) ? "archivo" : nombre.Trim();

            foreach (char caracter in Path.GetInvalidFileNameChars())
            {
                limpio = limpio.Replace(caracter, '_');
            }

            if (limpio.Length > 120)
                limpio = limpio.Substring(0, 120);

            return string.IsNullOrWhiteSpace(limpio) ? "archivo" : limpio;
        }

        private string ExtensionAdjuntoPermitida(string nombreArchivo, string tipoContenido)
        {
            return app.ArchivoPermitido.ExtensionPermitida(nombreArchivo, tipoContenido, permitirPdf: true);
        }

        private string NormalizarTipoAdjunto(string? tipoContenido, string nombreArchivo)
        {
            return app.ArchivoPermitido.NormalizarTipoContenido(tipoContenido, nombreArchivo, permitirPdf: true);
        }

        private string NormalizarContenidoBase64(string? contenido)
        {
            return app.ArchivoPermitido.NormalizarContenidoBase64(contenido);
        }

        private bool TipoAdjuntoPermitido(string tipoContenido)
        {
            return app.ArchivoPermitido.TipoContenidoPermitido(tipoContenido, permitirPdf: true);
        }

        private CompaniaInspeccionDTO MapCompaniaInspeccion(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            CompaniaInspeccionDTO Obj = new CompaniaInspeccionDTO();
            Obj.CodCompaniaInspeccion = Convert.ToInt32(reader["CodCompaniaInspeccion"]);
            Obj.IdCompaniaInspeccion = ObjEncriptacion.Encriptar(Obj.CodCompaniaInspeccion.ToString());
            Obj.NombreComercial = reader["NombreComercial"].ToString() ?? "";
            Obj.NombreFiscal = reader["NombreFiscal"].ToString() ?? "";
            Obj.Nit = reader["Nit"].ToString() ?? "";
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private CompaniaInspeccionAdjuntoDTO MapAdjunto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            CompaniaInspeccionAdjuntoDTO adjunto = new CompaniaInspeccionAdjuntoDTO
            {
                CodCompaniaInspeccionAdjunto = Int(reader["CodCompaniaInspeccionAdjunto"]),
                CodCompaniaInspeccion = Int(reader["CodCompaniaInspeccionArchivo"]),
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoAdjunto(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = Long(reader["TamanoBytes"]),
                RutaArchivo = reader["RutaArchivo"].ToString() ?? ""
            };

            return adjunto;
        }

        private CompaniaInspeccionDTO MapCompaniaInspeccionLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            CompaniaInspeccionDTO Obj = MapCompaniaInspeccion(reader);
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);
            return Obj;
        }

        private void Normalizar(CompaniaInspeccionDTO Obj)
        {
            Obj.NombreComercial = (Obj.NombreComercial ?? "").Trim();
            Obj.NombreFiscal = (Obj.NombreFiscal ?? "").Trim();
            Obj.Nit = (Obj.Nit ?? "").Trim();
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private int Int(object valor)
        {
            if (valor == DBNull.Value)
                return 0;

            return Convert.ToInt32(valor);
        }

        private long Long(object valor)
        {
            if (valor == DBNull.Value)
                return 0;

            return Convert.ToInt64(valor);
        }

        private bool Bool(object valor, bool valorPorDefecto = false)
        {
            if (valor == DBNull.Value)
                return valorPorDefecto;

            return Convert.ToBoolean(valor);
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
