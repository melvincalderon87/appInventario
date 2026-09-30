using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace app.Models.Tanque
{
    /// <summary>
    /// DAO para el mantenimiento de tanques.
    /// </summary>
    internal class TanqueDAO
    {
        private const int MaxAdjuntos = app.ArchivoPermitido.MaxAdjuntos;
        private const int MaxAdjuntoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private static readonly HashSet<string> TiposAdjuntosPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "image/jpeg",
            "image/png"
        };

        private TanqueDTO Obj = new TanqueDTO();
        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<TanqueDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "", bool? ConsumoPropio = null, string TipoProducto = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<TanqueDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, ConsumoPropio, TipoProducto), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapTanque(reader);
            });

            return new PaginacionResultado<TanqueDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar(bool? ConsumoPropio = null, string TipoProducto = "")
        {
            return ObjDAL.EjecutarReader(QueryListar(ConsumoPropio, TipoProducto), reader => new SelectListItem()
            {
                Text = reader["Tanque"].ToString(),
                Value = reader["CodTanque"].ToString()
            });
        }

        internal TanqueDTO Obtener(string CodTanque)
        {
            TanqueDTO tanque = ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodTanque), MapTanque).FirstOrDefault() ?? new TanqueDTO();

            if (!string.IsNullOrWhiteSpace(tanque.CodTanque))
            {
                tanque.Adjuntos = ListarAdjuntos(tanque.CodTanque);
                tanque.AdjuntoCantidad = tanque.Adjuntos.Count;
            }

            return tanque;
        }

        internal MsjDB Agregar(TanqueDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTanque(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionComentario = ValidarComentario(Obj);
            if (!validacionComentario.Estatus)
                return validacionComentario;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("Tanque", "CREADO", "CodTanque:" + Obj.CodTanque, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(TanqueDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTanque(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            TanqueDTO ObjAnterior = Obtener(Obj.CodTanque);
            Obj.Version = ObtenerVersion(Obj.CodTanque);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionComentario = ValidarComentario(Obj);
            if (!validacionComentario.Estatus)
                return validacionComentario;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("Tanque", "EDITADO", "CodTanque:" + Obj.CodTanque, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(TanqueDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTanque(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            TanqueDTO ObjAnterior = Obtener(Obj.CodTanque);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Tanque", "CodTanque", Obj.CodTanque);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Tanque", "ELIMINADO", "CodTanque:" + Obj.CodTanque, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarTanque(TanqueDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(string CodTanque)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodTanque), 1);
        }

        internal List<TanqueDTO> Log(string CodTanque)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodTanque), MapTanqueLog);
        }

        private MsjDB ValidarCodigoTanque(TanqueDTO Obj)
        {
            Obj.CodTanque = (Obj.CodTanque ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodTanque))
                return Error("El codigo de tanque es requerido.");

            if (Obj.CodTanque.Length > 20)
                return Error("El codigo de tanque debe tener maximo 20 caracteres.");

            return Ok();
        }

        private MsjDB ValidarComentario(TanqueDTO Obj)
        {
            Obj.Comentario = (Obj.Comentario ?? "").Trim();

            if (Obj.Comentario.Length > 250)
                return Error("El comentario debe tener maximo 250 caracteres.");

            return Ok();
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", TanqueDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Tanque (CodTanque,CodProducto,TipoTanque,Tanque,DescripcionCorta,Mencod,AlturaMaximaPies,AlturaMaximaPulgadas,TipoPosiconTecho,AlturaMinimaPies,AlturaMinimaPulgadas,VolumenMaximo,VolumenMinimo,VolumenTechoPosicionAlta,VolumenTechoPosicionBaja,Proveedor,ConsumoPropio,Comentario,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES(N'"
                            + SqlTexto(Obj.CodTanque) + "','"
                            + Obj.CodProducto + "','"
                            + SqlTexto(Obj.TipoTanque) + "','"
                            + SqlTexto(Obj.Tanque) + "','"
                            + SqlTexto(Obj.DescripcionCorta) + "','"
                            + SqlTexto(Obj.Mencod) + "','"
                            + Obj.AlturaMaximaPies + "','"
                            + Obj.AlturaMaximaPulgadas + "','"
                            + SqlTexto(Obj.TipoPosiconTecho) + "','"
                            + Obj.AlturaMinimaPies + "','"
                            + Obj.AlturaMinimaPulgadas + "',"
                            + SqlNumero(Obj.VolumenMaximo) + ","
                            + SqlNumero(Obj.VolumenMinimo) + ","
                            + SqlNumero(Obj.VolumenTechoPosicionAlta) + ","
                            + SqlNumero(Obj.VolumenTechoPosicionBaja) + ",'"
                            + SqlTexto(Obj.Proveedor) + "','"
                            + (Obj.ConsumoPropio ? "1" : "0") + "',N'"
                            + SqlTexto(Obj.Comentario) + "','"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "','"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Tanque SET "
                            + "CodProducto='" + Obj.CodProducto + "',"
                            + "TipoTanque='" + SqlTexto(Obj.TipoTanque) + "',"
                            + "Tanque='" + SqlTexto(Obj.Tanque) + "',"
                            + "DescripcionCorta='" + SqlTexto(Obj.DescripcionCorta) + "',"
                            + "Mencod='" + SqlTexto(Obj.Mencod) + "',"
                            + "AlturaMaximaPies='" + Obj.AlturaMaximaPies + "',"
                            + "AlturaMaximaPulgadas='" + Obj.AlturaMaximaPulgadas + "',"
                            + "TipoPosiconTecho='" + SqlTexto(Obj.TipoPosiconTecho) + "',"
                            + "AlturaMinimaPies='" + Obj.AlturaMinimaPies + "',"
                            + "AlturaMinimaPulgadas='" + Obj.AlturaMinimaPulgadas + "',"
                            + "VolumenMaximo=" + SqlNumero(Obj.VolumenMaximo) + ","
                            + "VolumenMinimo=" + SqlNumero(Obj.VolumenMinimo) + ","
                            + "VolumenTechoPosicionAlta=" + SqlNumero(Obj.VolumenTechoPosicionAlta) + ","
                            + "VolumenTechoPosicionBaja=" + SqlNumero(Obj.VolumenTechoPosicionBaja) + ","
                            + "Proveedor='" + SqlTexto(Obj.Proveedor) + "',"
                            + "ConsumoPropio='" + (Obj.ConsumoPropio ? "1" : "0") + "',"
                            + "Comentario=N'" + SqlTexto(Obj.Comentario) + "',"
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion='" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodTanque=N'" + SqlTexto(Obj.CodTanque) + "'";
                case TipoDAL.Eliminar:
                    return "IF OBJECT_ID('dbo.TanqueAdjunto', 'U') IS NOT NULL "
                            + "DELETE FROM dbo.TanqueAdjunto "
                            + "WHERE CodTanqueArchivo=N'" + SqlTexto(Obj.CodTanque) + "'; "
                            + "DELETE FROM Tanque WHERE CodTanque=N'" + SqlTexto(Obj.CodTanque) + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return QueryListar();
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodTanque]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Tanque A "
                        + "WHERE A.[Tanque]='" + SqlTexto(Obj.Tanque) + "' "
                        + "AND A.[CodProducto]='" + Obj.CodProducto + "' "
                        + "AND A.[CodTanque] <> N'" + SqlTexto(Obj.CodTanque) + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT [CodTanque],[Version] FROM Tanque_LOG UNION ALL SELECT [CodTanque],[Version] FROM Tanque) A " +
                        "WHERE A.[CodTanque]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodTanque], A.[CodProducto], ISNULL(P.[Producto], '') AS [Producto], A.[TipoTanque], A.[Tanque], A.[DescripcionCorta], A.[Mencod],"
                      + "A.[AlturaMaximaPies], A.[AlturaMaximaPulgadas], A.[TipoPosiconTecho], A.[AlturaMinimaPies], A.[AlturaMinimaPulgadas],"
                      + "A.[VolumenMaximo], A.[VolumenMinimo], A.[VolumenTechoPosicionAlta], A.[VolumenTechoPosicionBaja], A.[Proveedor], A.[ConsumoPropio], A.[Comentario], A.[Estatus],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (" + SelectUnionLog("Tanque_LOG") + " UNION ALL " + SelectUnionLog("Tanque") + ") A "
                      + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                      + "WHERE A.[CodTanque] = N'" + SqlTexto(CodKey) + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodTanque],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],A.[TipoTanque],A.[Tanque],A.[DescripcionCorta],A.[Mencod],"
                + "A.[AlturaMaximaPies],A.[AlturaMaximaPulgadas],A.[TipoPosiconTecho],A.[AlturaMinimaPies],A.[AlturaMinimaPulgadas],"
                + "A.[VolumenMaximo],A.[VolumenMinimo],A.[VolumenTechoPosicionAlta],A.[VolumenTechoPosicionBaja],A.[Proveedor],A.[ConsumoPropio],A.[Comentario],ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM Tanque A "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] ";
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodTanque],[CodProducto],[TipoTanque],[Tanque],[DescripcionCorta],[Mencod],"
                + "[AlturaMaximaPies],[AlturaMaximaPulgadas],[TipoPosiconTecho],[AlturaMinimaPies],[AlturaMinimaPulgadas],"
                + "[VolumenMaximo],[VolumenMinimo],[VolumenTechoPosicionAlta],[VolumenTechoPosicionBaja],[Proveedor],[ConsumoPropio],[Comentario],[Estatus],"
                + "[Version],[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog] "
                + "FROM " + tabla;
        }

        private string QueryListado(PaginacionParametros paginacion, bool? ConsumoPropio = null, string TipoProducto = "")
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codTanque"] = "A.[CodTanque]",
                ["codProducto"] = "A.[CodProducto]",
                ["producto"] = "P.[Producto]",
                ["tipoTanque"] = "A.[TipoTanque]",
                ["tanque"] = "A.[Tanque]",
                ["descripcioncorta"] = "A.[DescripcionCorta]",
                ["mencod"] = "A.[Mencod]",
                ["alturaMaximaPies"] = "A.[AlturaMaximaPies]",
                ["alturaMaximaPulgadas"] = "A.[AlturaMaximaPulgadas]",
                ["tipoPosiconTecho"] = "A.[TipoPosiconTecho]",
                ["alturaMinimaPies"] = "A.[AlturaMinimaPies]",
                ["alturaMinimaPulgadas"] = "A.[AlturaMinimaPulgadas]",
                ["volumenMaximo"] = "A.[VolumenMaximo]",
                ["volumenMinimo"] = "A.[VolumenMinimo]",
                ["volumenTechoPosicionAlta"] = "A.[VolumenTechoPosicionAlta]",
                ["volumenTechoPosicionBaja"] = "A.[VolumenTechoPosicionBaja]",
                ["proveedor"] = "A.[Proveedor]",
                ["consumoPropio"] = "A.[ConsumoPropio]",
                ["comentario"] = "A.[Comentario]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + QueryFiltroConsumoPropio(ConsumoPropio)
                + QueryFiltroTipoProducto(TipoProducto)
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodTanque])",
                    "CONVERT(VARCHAR(20), A.[CodProducto])",
                    "P.[Producto]",
                    "A.[TipoTanque]",
                    "A.[Tanque]",
                    "A.[DescripcionCorta]",
                    "A.[Mencod]",
                    "CONVERT(VARCHAR(20), A.[AlturaMaximaPies])",
                    "CONVERT(VARCHAR(20), A.[AlturaMaximaPulgadas])",
                    "A.[TipoPosiconTecho]",
                    "CONVERT(VARCHAR(20), A.[AlturaMinimaPies])",
                    "CONVERT(VARCHAR(20), A.[AlturaMinimaPulgadas])",
                    "CONVERT(VARCHAR(30), A.[VolumenMaximo])",
                    "CONVERT(VARCHAR(30), A.[VolumenMinimo])",
                    "CONVERT(VARCHAR(30), A.[VolumenTechoPosicionAlta])",
                    "CONVERT(VARCHAR(30), A.[VolumenTechoPosicionBaja])",
                    "A.[Proveedor]",
                    "CONVERT(VARCHAR(5), A.[ConsumoPropio])",
                    "A.[Comentario]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodTanque] ASC");

            return "SELECT A.[CodTanque],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],A.[TipoTanque],A.[Tanque],A.[DescripcionCorta],A.[Mencod],"
                + "A.[AlturaMaximaPies],A.[AlturaMaximaPulgadas],A.[TipoPosiconTecho],A.[AlturaMinimaPies],A.[AlturaMinimaPulgadas],"
                + "A.[VolumenMaximo],A.[VolumenMinimo],A.[VolumenTechoPosicionAlta],A.[VolumenTechoPosicionBaja],A.[Proveedor],A.[ConsumoPropio],A.[Comentario],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Tanque A "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryListar(bool? ConsumoPropio = null, string TipoProducto = "")
        {
            return "SELECT A.[CodTanque],A.[Tanque] "
                + "FROM Tanque A "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN TipoProducto TP ON P.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "WHERE 1 = 1 "
                + QueryFiltroConsumoPropio(ConsumoPropio)
                + QueryFiltroTipoProducto(TipoProducto)
                + "ORDER BY A.[Tanque]";
        }

        private string QueryFiltroConsumoPropio(bool? ConsumoPropio)
        {
            return ConsumoPropio.HasValue
                ? "AND A.[ConsumoPropio] = " + (ConsumoPropio.Value ? "1" : "0") + " "
                : "";
        }

        private string QueryFiltroTipoProducto(string TipoProducto)
        {
            string valor = SqlTexto(TipoProducto).Trim();

            if (string.IsNullOrWhiteSpace(valor))
                return "";

            if (valor.Equals("Combustible", StringComparison.OrdinalIgnoreCase)
                || valor.Equals("Combustible", StringComparison.OrdinalIgnoreCase))
            {
                return "AND UPPER(TP.[Descripcion]) IN (UPPER('Combustible'), UPPER('Combustible')) ";
            }

            return "AND UPPER(TP.[Descripcion]) = UPPER('" + valor + "') ";
        }

        internal TanqueAdjuntoDTO ObtenerAdjunto(string CodTanque, int CodTanqueAdjunto)
        {
            if (!ExisteTablaAdjuntos())
                return new TanqueAdjuntoDTO();

            return ObjDAL
                .EjecutarReader(QueryObtenerAdjunto(CodTanque, CodTanqueAdjunto), MapAdjunto)
                .FirstOrDefault()
                ?? new TanqueAdjuntoDTO();
        }

        internal byte[] LeerArchivoAdjunto(TanqueAdjuntoDTO adjunto)
        {
            if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(adjunto.RutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        private List<TanqueAdjuntoDTO> ListarAdjuntos(string CodTanque)
        {
            if (!ExisteTablaAdjuntos())
                return new List<TanqueAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(CodTanque), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(TanqueDTO Obj)
        {
            Obj.Adjuntos ??= new List<TanqueAdjuntoDTO>();

            if (Obj.Adjuntos.Count == 0 && !ExisteTablaAdjuntos())
                return Ok();

            if (!ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de tanques no existe.");

            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(TanqueDTO Obj)
        {
            Obj.Adjuntos ??= new List<TanqueAdjuntoDTO>();

            if (Obj.Adjuntos.Count > 0 && !ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de tanques no existe.");

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("El tanque puede tener maximo " + MaxAdjuntos + " archivos.");

            List<TanqueAdjuntoDTO> adjuntos = new List<TanqueAdjuntoDTO>();
            foreach (TanqueAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                if (adjunto == null)
                    continue;

                adjunto.NombreArchivo = Path.GetFileName((adjunto.NombreArchivo ?? "").Trim());
                adjunto.TipoContenido = NormalizarTipoContenido(adjunto.TipoContenido, adjunto.NombreArchivo);
                adjunto.RutaArchivo = (adjunto.RutaArchivo ?? "").Trim();
                adjunto.ContenidoBase64 = NormalizarContenidoBase64(adjunto.ContenidoBase64);

                bool vacio = string.IsNullOrWhiteSpace(adjunto.NombreArchivo)
                    && string.IsNullOrWhiteSpace(adjunto.RutaArchivo)
                    && string.IsNullOrWhiteSpace(adjunto.ContenidoBase64);
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
                    adjunto.RutaArchivo = GuardarArchivoFisico(Obj.CodTanque, adjunto, contenido);
                    adjunto.ContenidoBase64 = "";
                }
                else if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                {
                    return Error("El archivo es requerido.");
                }

                adjunto.CodTanque = Obj.CodTanque;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.TanqueAdjunto')");
        }

        private string QueryListarAdjuntos(string CodTanque)
        {
            return "SELECT CodTanqueAdjunto,CodTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.TanqueAdjunto "
                + "WHERE CodTanqueArchivo=N'" + SqlTexto(CodTanque) + "' "
                + "ORDER BY CodTanqueAdjunto";
        }

        private string QueryObtenerAdjunto(string CodTanque, int CodTanqueAdjunto)
        {
            return "SELECT CodTanqueAdjunto,CodTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.TanqueAdjunto "
                + "WHERE CodTanqueArchivo=N'" + SqlTexto(CodTanque) + "' "
                + "AND CodTanqueAdjunto='" + CodTanqueAdjunto + "'";
        }

        private string QueryGuardarAdjuntos(TanqueDTO Obj)
        {
            string sql = "DELETE FROM dbo.TanqueAdjunto "
                + "WHERE CodTanqueArchivo=N'" + SqlTexto(Obj.CodTanque) + "'; "
                + "DECLARE @CodTanqueAdjunto INT; ";

            foreach (TanqueAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.TanqueAdjunto'), 'CodTanqueAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.TanqueAdjunto "
                    + "(CodTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(N'"
                    + SqlTexto(Obj.CodTanque) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodTanqueAdjunto = ISNULL(MAX(CodTanqueAdjunto), 0) + 1 "
                    + "FROM dbo.TanqueAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.TanqueAdjunto "
                    + "(CodTanqueAdjunto,CodTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(@CodTanqueAdjunto,N'"
                    + SqlTexto(Obj.CodTanque) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END ";
            }

            return sql;
        }

        private string GuardarArchivoFisico(string CodTanque, TanqueAdjuntoDTO adjunto, byte[] contenido)
        {
            string carpeta = CarpetaAdjuntos();
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionPermitida(adjunto.NombreArchivo, adjunto.TipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(adjunto.NombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string nombreArchivo = "TK" + NombreArchivoSeguro(CodTanque) + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "Tanques", nombreArchivo);
        }

        private string CarpetaAdjuntos()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "Tanques");
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

        private TanqueDTO MapTanque(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TanqueDTO Obj = new TanqueDTO();
            Obj.CodTanque = reader["CodTanque"].ToString() ?? "";
            Obj.IdTanque = ObjEncriptacion.Encriptar(Obj.CodTanque);
            Obj.CodProducto = Convert.ToInt32(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.TipoTanque = reader["TipoTanque"].ToString() ?? "";
            Obj.Tanque = reader["Tanque"].ToString() ?? "";
            Obj.DescripcionCorta = reader["DescripcionCorta"].ToString() ?? "";
            Obj.Mencod = reader["Mencod"].ToString() ?? "";
            Obj.AlturaMaximaPies = Int(reader["AlturaMaximaPies"]);
            Obj.AlturaMaximaPulgadas = Int(reader["AlturaMaximaPulgadas"]);
            Obj.TipoPosiconTecho = reader["TipoPosiconTecho"].ToString() ?? "No aplica";
            Obj.AlturaMinimaPies = Int(reader["AlturaMinimaPies"]);
            Obj.AlturaMinimaPulgadas = Int(reader["AlturaMinimaPulgadas"]);
            Obj.VolumenMaximo = DecimalValor(reader["VolumenMaximo"]);
            Obj.VolumenMinimo = DecimalValor(reader["VolumenMinimo"]);
            Obj.VolumenTechoPosicionAlta = DecimalValor(reader["VolumenTechoPosicionAlta"]);
            Obj.VolumenTechoPosicionBaja = DecimalValor(reader["VolumenTechoPosicionBaja"]);
            Obj.Proveedor = reader["Proveedor"].ToString() ?? "";
            Obj.ConsumoPropio = Bool(reader["ConsumoPropio"]);
            Obj.Comentario = reader["Comentario"].ToString() ?? "";
            Obj.Estatus = Bool(reader["Estatus"], true);
            return Obj;
        }

        private TanqueAdjuntoDTO MapAdjunto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TanqueAdjuntoDTO adjunto = new TanqueAdjuntoDTO
            {
                CodTanqueAdjunto = Int(reader["CodTanqueAdjunto"]),
                CodTanque = reader["CodTanqueArchivo"].ToString() ?? "",
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoContenido(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = Long(reader["TamanoBytes"]),
                RutaArchivo = reader["RutaArchivo"].ToString() ?? ""
            };

            return adjunto;
        }

        private TanqueDTO MapTanqueLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TanqueDTO Obj = MapTanque(reader);
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

        private string SqlNumero(decimal valor)
        {
            return valor.ToString(CultureInfo.InvariantCulture);
        }

        private int Int(object valor)
        {
            if (valor == DBNull.Value)
                return 0;

            return Convert.ToInt32(valor);
        }

        private decimal DecimalValor(object valor)
        {
            if (valor == DBNull.Value)
                return 0m;

            return Convert.ToDecimal(valor);
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




