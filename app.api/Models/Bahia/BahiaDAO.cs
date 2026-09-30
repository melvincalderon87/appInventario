using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace app.Models.Bahia
{
    /// <summary>
    /// DAO para el mantenimiento de bahias.
    /// </summary>
    internal class BahiaDAO
    {
        private const int MaxAdjuntos = app.ArchivoPermitido.MaxAdjuntos;
        private const int MaxAdjuntoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private static readonly HashSet<string> TiposAdjuntosPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "image/jpeg",
            "image/png"
        };

        private BahiaDTO Obj = new BahiaDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<BahiaDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<BahiaDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapBahia(reader);
            });

            return new PaginacionResultado<BahiaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Bahia"].ToString(),
                Value = reader["CodBahia"].ToString()
            });
        }

        internal BahiaDTO Obtener(string CodBahia)
        {
            BahiaDTO bahia = ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodBahia), MapBahia).FirstOrDefault() ?? new BahiaDTO();

            if (!string.IsNullOrWhiteSpace(bahia.CodBahia))
            {
                bahia.Adjuntos = ListarAdjuntos(bahia.CodBahia);
                bahia.AdjuntoCantidad = bahia.Adjuntos.Count;
            }

            return bahia;
        }

        internal MsjDB Agregar(BahiaDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoBahia(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            if (ExisteCodigo(Obj.CodBahia))
                return Error("El codigo de bahia ya existe.");

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

                LogModificacionDAO.Registrar("Bahia", "CREADO", "CodBahia:" + Obj.CodBahia, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(BahiaDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoBahia(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            BahiaDTO ObjAnterior = Obtener(Obj.CodBahia);
            Obj.Version = ObtenerVersion(Obj.CodBahia);
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

                LogModificacionDAO.Registrar("Bahia", "EDITADO", "CodBahia:" + Obj.CodBahia, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(BahiaDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoBahia(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            BahiaDTO ObjAnterior = Obtener(Obj.CodBahia);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Bahia", "CodBahia", Obj.CodBahia);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Bahia", "ELIMINADO", "CodBahia:" + Obj.CodBahia, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarBahia(BahiaDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal bool ExisteCodigo(string CodBahia)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Bahia A WHERE A.[CodBahia]=N'" + SqlTexto(CodBahia) + "'");
        }

        internal int ObtenerVersion(string CodBahia)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodBahia), 1);
        }

        internal List<BahiaDTO> Log(string CodBahia)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodBahia), MapBahiaLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", BahiaDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Bahia (CodBahia,Bahia,DescripcionCorta,CantidadBrazos,CantidadAditivos,CantidadEtanol,Multiload,Comentario,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES(N'"
                            + SqlTexto(Obj.CodBahia) + "',N'"
                            + SqlTexto(Obj.Bahia) + "',N'"
                            + SqlTexto(Obj.DescripcionCorta) + "','"
                            + Obj.CantidadBrazos + "','"
                            + Obj.CantidadAditivos + "','"
                            + Obj.CantidadEtanol + "',N'"
                            + SqlTexto(Obj.Multiload) + "',N'"
                            + SqlTexto(Obj.Comentario) + "','"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Bahia SET "
                            + "Bahia='" + SqlTexto(Obj.Bahia) + "',"
                            + "DescripcionCorta='" + SqlTexto(Obj.DescripcionCorta) + "',"
                            + "CantidadBrazos='" + Obj.CantidadBrazos + "',"
                            + "CantidadAditivos='" + Obj.CantidadAditivos + "',"
                            + "CantidadEtanol='" + Obj.CantidadEtanol + "',"
                            + "Multiload=N'" + SqlTexto(Obj.Multiload) + "',"
                            + "Comentario=N'" + SqlTexto(Obj.Comentario) + "',"
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodBahia=N'" + SqlTexto(Obj.CodBahia) + "'";
                case TipoDAL.Eliminar:
                    return "IF OBJECT_ID('dbo.BahiaAdjunto', 'U') IS NOT NULL "
                            + "DELETE FROM dbo.BahiaAdjunto WHERE CodBahia=N'" + SqlTexto(Obj.CodBahia) + "'; "
                            + "DELETE FROM Bahia WHERE CodBahia=N'" + SqlTexto(Obj.CodBahia) + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodBahia],A.[Bahia] FROM Bahia A ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodBahia]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Bahia A "
                        + "WHERE A.[Bahia]='" + SqlTexto(Obj.Bahia) + "' "
                        + "AND A.[CodBahia] <> N'" + SqlTexto(Obj.CodBahia) + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT [CodBahia],[Version] FROM Bahia_LOG UNION ALL SELECT [CodBahia],[Version] FROM Bahia) A " +
                        "WHERE A.[CodBahia]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodBahia],A.[Bahia],A.[DescripcionCorta],"
                      + "A.[CantidadBrazos],A.[CantidadAditivos],A.[CantidadEtanol],A.[Multiload],A.[Comentario],A.[Estatus],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (" + SelectUnionLog("Bahia_LOG") + " UNION ALL " + SelectUnionLog("Bahia") + ") A "
                      + "WHERE A.[CodBahia] = N'" + SqlTexto(CodKey) + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodBahia],A.[Bahia],A.[DescripcionCorta],"
                + "A.[CantidadBrazos],A.[CantidadAditivos],A.[CantidadEtanol],A.[Multiload],A.[Comentario],ISNULL(A.[Estatus],1) AS [Estatus] "
                + "FROM Bahia A ";
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodBahia],[Bahia],[DescripcionCorta],"
                + "[CantidadBrazos],[CantidadAditivos],[CantidadEtanol],[Multiload],[Comentario],[Estatus],"
                + "[Version],[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog] "
                + "FROM " + tabla;
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codBahia"] = "A.[CodBahia]",
                ["bahia"] = "A.[Bahia]",
                ["descripcioncorta"] = "A.[DescripcionCorta]",
                ["cantidadBrazos"] = "A.[CantidadBrazos]",
                ["cantidadAditivos"] = "A.[CantidadAditivos]",
                ["cantidadEtanol"] = "A.[CantidadEtanol]",
                ["multiload"] = "A.[Multiload]",
                ["comentario"] = "A.[Comentario]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodBahia])",
                    "A.[Bahia]",
                    "A.[DescripcionCorta]",
                    "CONVERT(VARCHAR(20), A.[CantidadBrazos])",
                    "CONVERT(VARCHAR(20), A.[CantidadAditivos])",
                    "CONVERT(VARCHAR(20), A.[CantidadEtanol])",
                    "A.[Multiload]",
                    "A.[Comentario]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodBahia] ASC");

            return "SELECT A.[CodBahia],A.[Bahia],A.[DescripcionCorta],"
                + "A.[CantidadBrazos],A.[CantidadAditivos],A.[CantidadEtanol],A.[Multiload],A.[Comentario],ISNULL(A.[Estatus],1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Bahia A "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        internal BahiaAdjuntoDTO ObtenerAdjunto(string CodBahia, int CodBahiaAdjunto)
        {
            if (!ExisteTablaAdjuntos())
                return new BahiaAdjuntoDTO();

            return ObjDAL
                .EjecutarReader(QueryObtenerAdjunto(CodBahia, CodBahiaAdjunto), MapAdjunto)
                .FirstOrDefault()
                ?? new BahiaAdjuntoDTO();
        }

        internal byte[] LeerArchivoAdjunto(BahiaAdjuntoDTO adjunto)
        {
            if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(adjunto.RutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        private List<BahiaAdjuntoDTO> ListarAdjuntos(string CodBahia)
        {
            if (!ExisteTablaAdjuntos())
                return new List<BahiaAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(CodBahia), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(BahiaDTO Obj)
        {
            Obj.Adjuntos ??= new List<BahiaAdjuntoDTO>();

            if (Obj.Adjuntos.Count == 0 && !ExisteTablaAdjuntos())
                return Ok();

            if (!ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de bahia no existe.");

            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(BahiaDTO Obj)
        {
            Obj.Adjuntos ??= new List<BahiaAdjuntoDTO>();

            if (Obj.Adjuntos.Count > 0 && !ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de bahia no existe.");

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("La bahia puede tener maximo " + MaxAdjuntos + " archivos.");

            List<BahiaAdjuntoDTO> adjuntos = new List<BahiaAdjuntoDTO>();
            foreach (BahiaAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                if (adjunto == null)
                    continue;

                adjunto.NombreArchivo = Path.GetFileName((adjunto.NombreArchivo ?? "").Trim());
                adjunto.TipoContenido = NormalizarTipoContenido(adjunto.TipoContenido, adjunto.NombreArchivo);
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
                    adjunto.RutaArchivo = GuardarArchivoFisico(Obj.CodBahia, adjunto, contenido);
                    adjunto.ContenidoBase64 = "";
                }
                else if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                {
                    return Error("El archivo es requerido.");
                }

                adjunto.CodBahia = Obj.CodBahia;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.BahiaAdjunto')");
        }

        private string QueryListarAdjuntos(string CodBahia)
        {
            return "SELECT CodBahiaAdjunto,CodBahia,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.BahiaAdjunto "
                + "WHERE CodBahia=N'" + SqlTexto(CodBahia) + "' "
                + "ORDER BY CodBahiaAdjunto";
        }

        private string QueryObtenerAdjunto(string CodBahia, int CodBahiaAdjunto)
        {
            return "SELECT CodBahiaAdjunto,CodBahia,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.BahiaAdjunto "
                + "WHERE CodBahia=N'" + SqlTexto(CodBahia) + "' "
                + "AND CodBahiaAdjunto='" + CodBahiaAdjunto + "' "
                ;
        }

        private string QueryGuardarAdjuntos(BahiaDTO Obj)
        {
            string sql = "DELETE FROM dbo.BahiaAdjunto WHERE CodBahia=N'" + SqlTexto(Obj.CodBahia) + "'; "
                + "DECLARE @CodBahiaAdjunto INT; ";

            foreach (BahiaAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.BahiaAdjunto'), 'CodBahiaAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.BahiaAdjunto "
                    + "(CodBahia,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(N'"
                    + SqlTexto(Obj.CodBahia) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodBahiaAdjunto = ISNULL(MAX(CodBahiaAdjunto), 0) + 1 "
                    + "FROM dbo.BahiaAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.BahiaAdjunto "
                    + "(CodBahiaAdjunto,CodBahia,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(@CodBahiaAdjunto,N'"
                    + SqlTexto(Obj.CodBahia) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END ";
            }

            return sql;
        }

        private string GuardarArchivoFisico(string CodBahia, BahiaAdjuntoDTO adjunto, byte[] contenido)
        {
            string carpeta = CarpetaAdjuntos();
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionPermitida(adjunto.NombreArchivo, adjunto.TipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(adjunto.NombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string codigoSeguro = NombreArchivoSeguro(CodBahia);
            string nombreArchivo = "BH" + codigoSeguro + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "Bahias", nombreArchivo);
        }

        private string CarpetaAdjuntos()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "Bahias");
        }

        private string RutaAbsolutaDesdeRelativa(string rutaRelativa)
        {
            string raiz = Path.GetFullPath(CarpetaAdjuntos());
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

        private string ExtensionPermitida(string nombreArchivo, string tipoContenido)
        {
            return app.ArchivoPermitido.ExtensionPermitida(nombreArchivo, tipoContenido, permitirPdf: true);
        }

        private string NormalizarTipoContenido(string? tipoContenido, string nombreArchivo)
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

        private BahiaDTO MapBahia(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BahiaDTO Obj = new BahiaDTO();
            Obj.CodBahia = reader["CodBahia"].ToString() ?? "";
            Obj.IdBahia = ObjEncriptacion.Encriptar(Obj.CodBahia);
            Obj.Bahia = reader["Bahia"].ToString() ?? "";
            Obj.DescripcionCorta = reader["DescripcionCorta"].ToString() ?? "";
            Obj.CantidadBrazos = Int(reader["CantidadBrazos"]);
            Obj.CantidadAditivos = Int(reader["CantidadAditivos"]);
            Obj.CantidadEtanol = Int(reader["CantidadEtanol"]);
            Obj.Multiload = reader["Multiload"].ToString() ?? "";
            Obj.Comentario = reader["Comentario"].ToString() ?? "";
            Obj.Estatus = Bool(reader["Estatus"], true);
            return Obj;
        }

        private BahiaAdjuntoDTO MapAdjunto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BahiaAdjuntoDTO adjunto = new BahiaAdjuntoDTO
            {
                CodBahiaAdjunto = Int(reader["CodBahiaAdjunto"]),
                CodBahia = reader["CodBahia"].ToString() ?? "",
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoContenido(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = Long(reader["TamanoBytes"]),
                RutaArchivo = reader["RutaArchivo"].ToString() ?? ""
            };
            return adjunto;
        }

        private BahiaDTO MapBahiaLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BahiaDTO Obj = MapBahia(reader);
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

        private MsjDB ValidarCodigoBahia(BahiaDTO Obj)
        {
            Obj.CodBahia = (Obj.CodBahia ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodBahia))
                return Error("El codigo de bahia es requerido.");

            if (Obj.CodBahia.Length > 20)
                return Error("El codigo de bahia debe tener maximo 20 caracteres.");

            return Ok();
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
