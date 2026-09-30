using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace app.Models.Brazo
{
    /// <summary>
    /// DAO para el mantenimiento de brazos.
    /// </summary>
    internal class BrazoDAO
    {
        private const int MaxAdjuntos = app.ArchivoPermitido.MaxAdjuntos;
        private const int MaxAdjuntoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private static readonly HashSet<string> TiposAdjuntosPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "image/jpeg",
            "image/png"
        };
        private BrazoDTO Obj = new BrazoDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<BrazoDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "", string CodBahia = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<BrazoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, CodBahia), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapBrazo(reader);
            });

            return new PaginacionResultado<BrazoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<BrazoDTO> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new BrazoDTO()
            {
                CodBrazo = reader["CodBrazo"].ToString() ?? "",
                CodBahia = reader["CodBahia"].ToString() ?? "",
                Brazo = reader["Brazo"].ToString() ?? ""
            });
        }

        internal BrazoDTO Obtener(string CodBrazo)
        {
            BrazoDTO brazo = ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodBrazo), MapBrazo).FirstOrDefault() ?? new BrazoDTO();

            if (!string.IsNullOrWhiteSpace(brazo.CodBrazo))
            {
                brazo.Adjuntos = ListarAdjuntos(brazo.CodBrazo);
                brazo.AdjuntoCantidad = brazo.Adjuntos.Count;
            }

            return brazo;
        }

        internal MsjDB Agregar(BrazoDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoBrazo(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            if (ExisteCodigo(Obj.CodBrazo))
                return Error("El codigo de brazo ya existe.");

            MsjDB validacionBahia = ValidarCodigoBahia(Obj);
            if (!validacionBahia.Estatus)
                return validacionBahia;

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

                LogModificacionDAO.Registrar("Brazo", "CREADO", "CodBrazo:" + Obj.CodBrazo, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(BrazoDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoBrazo(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            BrazoDTO ObjAnterior = Obtener(Obj.CodBrazo);
            Obj.Version = ObtenerVersion(Obj.CodBrazo);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionBahia = ValidarCodigoBahia(Obj);
            if (!validacionBahia.Estatus)
                return validacionBahia;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("Brazo", "EDITADO", "CodBrazo:" + Obj.CodBrazo, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(BrazoDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoBrazo(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            BrazoDTO ObjAnterior = Obtener(Obj.CodBrazo);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Brazo", "CodBrazo", Obj.CodBrazo);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Brazo", "ELIMINADO", "CodBrazo:" + Obj.CodBrazo, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarBrazo(BrazoDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal bool ExisteCodigo(string CodBrazo)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Brazo A WHERE A.[CodBrazo]=N'" + SqlTexto(CodBrazo) + "'");
        }

        internal int ObtenerVersion(string CodBrazo)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodBrazo), 1);
        }

        internal List<BrazoDTO> Log(string CodBrazo)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodBrazo), MapBrazoLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", BrazoDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Brazo (CodBrazo,CodBahia,Brazo,CodProducto,Comentario,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES(N'"
                            + SqlTexto(Obj.CodBrazo) + "',N'"
                            + SqlTexto(Obj.CodBahia) + "','"
                            + SqlTexto(Obj.Brazo) + "','"
                            + Obj.CodProducto + "','"
                            + SqlTexto(Obj.Comentario) + "','"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Brazo SET "
                            + "CodBahia=N'" + SqlTexto(Obj.CodBahia) + "',"
                            + "Brazo='" + SqlTexto(Obj.Brazo) + "',"
                            + "CodProducto='" + Obj.CodProducto + "',"
                            + "Comentario=N'" + SqlTexto(Obj.Comentario) + "',"
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodBrazo=N'" + SqlTexto(Obj.CodBrazo) + "'";
                case TipoDAL.Eliminar:
                    return "IF OBJECT_ID('dbo.BrazoAdjunto', 'U') IS NOT NULL "
                            + "DELETE FROM dbo.BrazoAdjunto "
                            + "WHERE CodBrazoArchivo=N'" + SqlTexto(Obj.CodBrazo) + "'; "
                            + "DELETE FROM Brazo WHERE CodBrazo=N'" + SqlTexto(Obj.CodBrazo) + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodBrazo],A.[CodBahia],A.[Brazo] FROM Brazo A ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodBrazo]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Brazo A "
                        + "WHERE A.[Brazo]='" + SqlTexto(Obj.Brazo) + "' "
                        + "AND A.[CodBahia]=N'" + SqlTexto(Obj.CodBahia) + "' "
                        + "AND A.[CodProducto]='" + Obj.CodProducto + "' "
                        + "AND A.[CodBrazo] <> N'" + SqlTexto(Obj.CodBrazo) + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT [CodBrazo],[Version] FROM Brazo_LOG UNION ALL SELECT [CodBrazo],[Version] FROM Brazo) A " +
                        "WHERE A.[CodBrazo]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodBrazo], A.[CodBahia], ISNULL(B.[Bahia], '') AS [Bahia], A.[Brazo],"
                      + "A.[CodProducto], ISNULL(P.[Producto], '') AS [Producto], A.[Comentario], ISNULL(A.[Estatus],1) AS [Estatus],"
                      + "A.[Version], A.[CodUsuarioCreacion], A.[FechaCreacion], A.[CodUsuarioActualizacion], A.[FechaActualizacion],"
                      + "A.[CodUsuarioEliminacion], A.[FechaEliminacion], A.[AccionLog] "
                      + "FROM (" + SelectUnionLog("Brazo_LOG") + " UNION ALL " + SelectUnionLog("Brazo") + ") A "
                      + "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                      + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                      + "WHERE A.[CodBrazo] = N'" + SqlTexto(CodKey) + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodBrazo],A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],"
                + "A.[Brazo],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[Comentario],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM Brazo A "
                + "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] ";
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodBrazo],[CodBahia],[Brazo],[CodProducto],[Comentario],[Estatus],"
                + "[Version],[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog] "
                + "FROM " + tabla;
        }

        private string QueryListado(PaginacionParametros paginacion, string CodBahia = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codBrazo"] = "A.[CodBrazo]",
                ["codBahia"] = "A.[CodBahia]",
                ["bahia"] = "B.[Bahia]",
                ["codProducto"] = "A.[CodProducto]",
                ["producto"] = "P.[Producto]",
                ["brazo"] = "A.[Brazo]",
                ["comentario"] = "A.[Comentario]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + (!string.IsNullOrWhiteSpace(CodBahia) ? "AND A.[CodBahia] = N'" + SqlTexto(CodBahia.Trim()) + "' " : "")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodBrazo])",
                    "CONVERT(VARCHAR(20), A.[CodBahia])",
                    "B.[Bahia]",
                    "CONVERT(VARCHAR(20), A.[CodProducto])",
                    "P.[Producto]",
                    "A.[Brazo]",
                    "A.[Comentario]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodBrazo] ASC");

            return "SELECT A.[CodBrazo],A.[CodBahia],ISNULL(B.[Bahia], '') AS [Bahia],A.[Brazo],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],A.[Comentario],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Brazo A "
                + "LEFT JOIN Bahia B ON A.[CodBahia] = B.[CodBahia] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        internal BrazoAdjuntoDTO ObtenerAdjunto(string CodBrazo, int CodBrazoAdjunto)
        {
            if (!ExisteTablaAdjuntos())
                return new BrazoAdjuntoDTO();

            return ObjDAL
                .EjecutarReader(QueryObtenerAdjunto(CodBrazo, CodBrazoAdjunto), MapAdjunto)
                .FirstOrDefault()
                ?? new BrazoAdjuntoDTO();
        }

        internal byte[] LeerArchivoAdjunto(BrazoAdjuntoDTO adjunto)
        {
            if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(adjunto.RutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        private List<BrazoAdjuntoDTO> ListarAdjuntos(string CodBrazo)
        {
            if (!ExisteTablaAdjuntos())
                return new List<BrazoAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(CodBrazo), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(BrazoDTO Obj)
        {
            Obj.Adjuntos ??= new List<BrazoAdjuntoDTO>();

            if (Obj.Adjuntos.Count == 0 && !ExisteTablaAdjuntos())
                return Ok();

            if (!ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de brazo no existe.");

            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(BrazoDTO Obj)
        {
            Obj.Adjuntos ??= new List<BrazoAdjuntoDTO>();

            if (Obj.Adjuntos.Count > 0 && !ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de brazo no existe.");

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("El brazo puede tener maximo " + MaxAdjuntos + " archivos.");

            List<BrazoAdjuntoDTO> adjuntos = new List<BrazoAdjuntoDTO>();
            foreach (BrazoAdjuntoDTO adjunto in Obj.Adjuntos)
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
                    adjunto.RutaArchivo = GuardarArchivoFisico(Obj.CodBrazo, adjunto, contenido);
                    adjunto.ContenidoBase64 = "";
                }
                else if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                {
                    return Error("El archivo es requerido.");
                }

                adjunto.CodBrazo = Obj.CodBrazo;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.BrazoAdjunto')");
        }

        private string QueryListarAdjuntos(string CodBrazo)
        {
            return "SELECT CodBrazoAdjunto,CodBrazoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.BrazoAdjunto "
                + "WHERE CodBrazoArchivo=N'" + SqlTexto(CodBrazo) + "' "
                + "ORDER BY CodBrazoAdjunto";
        }

        private string QueryObtenerAdjunto(string CodBrazo, int CodBrazoAdjunto)
        {
            return "SELECT CodBrazoAdjunto,CodBrazoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.BrazoAdjunto "
                + "WHERE CodBrazoArchivo=N'" + SqlTexto(CodBrazo) + "' "
                + "AND CodBrazoAdjunto='" + CodBrazoAdjunto + "'";
        }

        private string QueryGuardarAdjuntos(BrazoDTO Obj)
        {
            string sql = "DELETE FROM dbo.BrazoAdjunto "
                + "WHERE CodBrazoArchivo=N'" + SqlTexto(Obj.CodBrazo) + "'; "
                + "DECLARE @CodBrazoAdjunto INT; ";

            foreach (BrazoAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.BrazoAdjunto'), 'CodBrazoAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.BrazoAdjunto "
                    + "(CodBrazoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(N'"
                    + SqlTexto(Obj.CodBrazo) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodBrazoAdjunto = ISNULL(MAX(CodBrazoAdjunto), 0) + 1 "
                    + "FROM dbo.BrazoAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.BrazoAdjunto "
                    + "(CodBrazoAdjunto,CodBrazoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(@CodBrazoAdjunto,N'"
                    + SqlTexto(Obj.CodBrazo) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END ";
            }

            return sql;
        }

        private string GuardarArchivoFisico(string CodBrazo, BrazoAdjuntoDTO adjunto, byte[] contenido)
        {
            string carpeta = CarpetaAdjuntos();
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionPermitida(adjunto.NombreArchivo, adjunto.TipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(adjunto.NombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string codigoSeguro = NombreArchivoSeguro(CodBrazo);
            string nombreArchivo = "BR" + codigoSeguro + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "Brazos", nombreArchivo);
        }

        private string CarpetaAdjuntos()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "Brazos");
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

        private BrazoDTO MapBrazo(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BrazoDTO Obj = new BrazoDTO();
            Obj.CodBrazo = reader["CodBrazo"].ToString() ?? "";
            Obj.IdBrazo = ObjEncriptacion.Encriptar(Obj.CodBrazo);
            Obj.CodBahia = reader["CodBahia"].ToString() ?? "";
            Obj.IdBahia = ObjEncriptacion.Encriptar(Obj.CodBahia);
            Obj.Bahia = reader["Bahia"].ToString() ?? "";
            Obj.CodProducto = Int(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.Brazo = reader["Brazo"].ToString() ?? "";
            Obj.Comentario = reader["Comentario"].ToString() ?? "";
            Obj.Estatus = Bool(reader["Estatus"], true);
            return Obj;
        }

        private BrazoAdjuntoDTO MapAdjunto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BrazoAdjuntoDTO adjunto = new BrazoAdjuntoDTO
            {
                CodBrazoAdjunto = Int(reader["CodBrazoAdjunto"]),
                CodBrazo = reader["CodBrazoArchivo"].ToString() ?? "",
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoContenido(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = Long(reader["TamanoBytes"]),
                RutaArchivo = reader["RutaArchivo"].ToString() ?? ""
            };

            return adjunto;
        }

        private BrazoDTO MapBrazoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            BrazoDTO Obj = MapBrazo(reader);
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

        private MsjDB ValidarCodigoBrazo(BrazoDTO Obj)
        {
            Obj.CodBrazo = (Obj.CodBrazo ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodBrazo))
                return Error("El codigo de brazo es requerido.");

            if (Obj.CodBrazo.Length > 20)
                return Error("El codigo de brazo debe tener maximo 20 caracteres.");

            return Ok();
        }

        private MsjDB ValidarCodigoBahia(BrazoDTO Obj)
        {
            Obj.CodBahia = (Obj.CodBahia ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodBahia))
                return Error("La bahia es requerida.");

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
