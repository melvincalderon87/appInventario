using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace app.Models.Tuberia
{
    /// <summary>
    /// DAO para el mantenimiento de tuberias.
    /// </summary>
    internal class TuberiaDAO
    {
        private const string MovimientoEntrada = "ENTRADA";
        private const string MovimientoSalida = "SALIDA";
        private const string MovimientoNoAplica = "NO APLICA";
        private const int MaxAdjuntos = app.ArchivoPermitido.MaxAdjuntos;
        private const int MaxAdjuntoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private static readonly HashSet<string> TiposAdjuntosPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "image/jpeg",
            "image/png"
        };

        private DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<TuberiaDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "")
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<TuberiaDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapTuberia(reader);
            });

            return new PaginacionResultado<TuberiaDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Producto"].ToString(),
                Value = reader["CodTuberia"].ToString()
            });
        }

        internal List<TuberiaResumenProductoDTO> ResumenPorProducto()
        {
            return ObjDAL.EjecutarReader(QueryResumenPorProducto(), MapResumenProducto);
        }

        internal TuberiaDTO Obtener(string CodTuberia)
        {
            TuberiaDTO tuberia = ObjDAL.EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodTuberia), MapTuberia).FirstOrDefault() ?? new TuberiaDTO();

            if (!string.IsNullOrWhiteSpace(tuberia.CodTuberia))
            {
                tuberia.Adjuntos = ListarAdjuntos(tuberia.CodTuberia);
                tuberia.AdjuntoCantidad = tuberia.Adjuntos.Count;
            }

            return tuberia;
        }

        internal MsjDB Agregar(TuberiaDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTuberia(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionTipoProducto = ValidarTipoProducto(Obj);
            if (!validacionTipoProducto.Estatus)
                return validacionTipoProducto;

            MsjDB validacionProducto = ValidarProducto(Obj);
            if (!validacionProducto.Estatus)
                return validacionProducto;

            MsjDB validacionTipoMovimiento = ValidarTipoMovimiento(Obj);
            if (!validacionTipoMovimiento.Estatus)
                return validacionTipoMovimiento;

            MsjDB validacionTexto = ValidarCamposTexto(Obj);
            if (!validacionTexto.Estatus)
                return validacionTexto;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("Tuberia", "CREADO", "CodTuberia:" + Obj.CodTuberia, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(TuberiaDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTuberia(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            TuberiaDTO ObjAnterior = Obtener(Obj.CodTuberia);
            Obj.Version = ObtenerVersion(Obj.CodTuberia);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionTipoProducto = ValidarTipoProducto(Obj);
            if (!validacionTipoProducto.Estatus)
                return validacionTipoProducto;

            MsjDB validacionProducto = ValidarProducto(Obj);
            if (!validacionProducto.Estatus)
                return validacionProducto;

            MsjDB validacionTipoMovimiento = ValidarTipoMovimiento(Obj);
            if (!validacionTipoMovimiento.Estatus)
                return validacionTipoMovimiento;

            MsjDB validacionTexto = ValidarCamposTexto(Obj);
            if (!validacionTexto.Estatus)
                return validacionTexto;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("Tuberia", "EDITADO", "CodTuberia:" + Obj.CodTuberia, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(TuberiaDTO Obj)
        {
            MsjDB validacionCodigo = ValidarCodigoTuberia(Obj);
            if (!validacionCodigo.Estatus)
                return validacionCodigo;

            TuberiaDTO ObjAnterior = Obtener(Obj.CodTuberia);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("Tuberia", "CodTuberia", Obj.CodTuberia);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("Tuberia", "ELIMINADO", "CodTuberia:" + Obj.CodTuberia, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarTuberia(TuberiaDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(string CodTuberia)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodTuberia), 1);
        }

        private MsjDB ValidarCodigoTuberia(TuberiaDTO Obj)
        {
            Obj.CodTuberia = (Obj.CodTuberia ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodTuberia))
                return Error("El codigo de tuberia es requerido.");

            if (Obj.CodTuberia.Length > 20)
                return Error("El codigo de tuberia debe tener maximo 20 caracteres.");

            return Ok();
        }

        private MsjDB ValidarProducto(TuberiaDTO Obj)
        {
            Obj.CodProducto = (Obj.CodProducto ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodProducto))
                return Error("El producto es requerido.");

            if (Obj.CodProducto.Length > 20)
                return Error("El codigo de producto debe tener maximo 20 caracteres.");

            if (!ObjDAL.EjecutarExiste("SELECT 1 FROM Producto A WHERE A.[CodProducto]=N'" + SqlTexto(Obj.CodProducto) + "'"))
                return Error("El producto seleccionado no existe.");

            return Ok();
        }

        private MsjDB ValidarTipoProducto(TuberiaDTO Obj)
        {
            Obj.CodTipoProducto = (Obj.CodTipoProducto ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.CodTipoProducto))
                return Error("El tipo de producto es requerido.");

            if (Obj.CodTipoProducto.Length > 20)
                return Error("El codigo de tipo de producto debe tener maximo 20 caracteres.");

            if (!ObjDAL.EjecutarExiste("SELECT 1 FROM TipoProducto A WHERE A.[CodTipoProducto]=N'" + SqlTexto(Obj.CodTipoProducto) + "'"))
                return Error("El tipo de producto seleccionado no existe.");

            return Ok();
        }

        private MsjDB ValidarTipoMovimiento(TuberiaDTO Obj)
        {
            Obj.TipoMovimiento = NormalizarTipoMovimiento(Obj.TipoMovimiento);

            if (Obj.TipoMovimiento != MovimientoEntrada && Obj.TipoMovimiento != MovimientoSalida && Obj.TipoMovimiento != MovimientoNoAplica)
                return Error("El tipo de movimiento debe ser entrada, salida o no aplica.");

            return Ok();
        }

        private MsjDB ValidarCamposTexto(TuberiaDTO Obj)
        {
            Obj.Ubicacion = (Obj.Ubicacion ?? "").Trim();
            Obj.TramoLinea = (Obj.TramoLinea ?? "").Trim();
            Obj.Comentario = (Obj.Comentario ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.Ubicacion))
                return Error("La ubicacion es requerida.");

            if (Obj.Ubicacion.Length > 250)
                return Error("La ubicacion debe tener maximo 250 caracteres.");

            if (string.IsNullOrWhiteSpace(Obj.TramoLinea))
                return Error("El tramo de linea es requerido.");

            if (Obj.TramoLinea.Length > 250)
                return Error("El tramo de linea debe tener maximo 250 caracteres.");

            if (Obj.Comentario.Length > 250)
                return Error("El comentario debe tener maximo 250 caracteres.");

            return Ok();
        }

        internal List<TuberiaDTO> Log(string CodTuberia)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodTuberia), MapTuberiaLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, string CodKey = "", TuberiaDTO Obj = null!)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO Tuberia (CodTuberia,CodTanque,CodTipoProducto,CodProducto,Ubicacion,TramoLinea,DiametroInicio,DiametroFinal,Volumen,FechaCertificacion,CodCompaniaInspeccion,TipoMovimiento,Comentario,Estatus,Version,CodUsuarioCreacion,FechaCreacion)" +
                            "VALUES(N'"
                            + Obj.CodTuberia + "',"
                            + SqlTextoNullable(Obj.CodTanque) + ",N'"
                            + SqlTexto(Obj.CodTipoProducto) + "',N'"
                            + SqlTexto(Obj.CodProducto) + "',N'"
                            + SqlTexto(Obj.Ubicacion) + "',N'"
                            + SqlTexto(Obj.TramoLinea) + "',"
                            + SqlNumero(Obj.DiametroInicio) + ","
                            + SqlNumero(Obj.DiametroFinal) + ","
                            + SqlNumero(Obj.Volumen) + ","
                            + SqlFecha(Obj.FechaCertificacion) + ",'"
                            + Obj.CodCompaniaInspeccion + "',N'"
                            + SqlTexto(Obj.TipoMovimiento) + "',N'"
                            + SqlTexto(Obj.Comentario) + "','"
                            + (Obj.Estatus ? "1" : "0") + "','"
                            + Obj.Version + "',N'"
                            + SqlTexto(Obj.CodUsuarioCreacion) + "',"
                            + "GETDATE()" + ")";
                case TipoDAL.Editar:
                    return "UPDATE Tuberia SET "
                            + "CodTanque=" + SqlTextoNullable(Obj.CodTanque) + ","
                            + "CodTipoProducto=N'" + SqlTexto(Obj.CodTipoProducto) + "',"
                            + "CodProducto=N'" + SqlTexto(Obj.CodProducto) + "',"
                            + "Ubicacion=N'" + SqlTexto(Obj.Ubicacion) + "',"
                            + "TramoLinea=N'" + SqlTexto(Obj.TramoLinea) + "',"
                            + "DiametroInicio=" + SqlNumero(Obj.DiametroInicio) + ","
                            + "DiametroFinal=" + SqlNumero(Obj.DiametroFinal) + ","
                            + "Volumen=" + SqlNumero(Obj.Volumen) + ","
                            + "FechaCertificacion=" + SqlFecha(Obj.FechaCertificacion) + ","
                            + "CodCompaniaInspeccion='" + Obj.CodCompaniaInspeccion + "',"
                            + "TipoMovimiento=N'" + SqlTexto(Obj.TipoMovimiento) + "',"
                            + "Comentario=N'" + SqlTexto(Obj.Comentario) + "',"
                            + "Estatus='" + (Obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + Obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE() "
                            + "WHERE CodTuberia=N'" + SqlTexto(Obj.CodTuberia) + "'";
                case TipoDAL.Eliminar:
                    return "IF OBJECT_ID('dbo.TuberiaAdjunto', 'U') IS NOT NULL "
                            + "DELETE FROM dbo.TuberiaAdjunto "
                            + "WHERE CodTuberiaArchivo=N'" + SqlTexto(Obj.CodTuberia) + "'; "
                            + "DELETE FROM Tuberia WHERE CodTuberia=N'" + SqlTexto(Obj.CodTuberia) + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodTuberia],ISNULL(P.[Producto], '') AS [Producto] "
                        + "FROM Tuberia A "
                        + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                        + "WHERE ISNULL(A.[Estatus], 1)=1 ORDER BY P.[Producto] ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodTuberia]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM Tuberia A "
                        + "WHERE A.[CodTipoProducto]=N'" + SqlTexto(Obj.CodTipoProducto) + "' "
                        + "AND A.[CodProducto]=N'" + SqlTexto(Obj.CodProducto) + "' "
                        + "AND A.[TramoLinea]=N'" + SqlTexto(Obj.TramoLinea) + "' "
                        + "AND A.[TipoMovimiento]=N'" + SqlTexto(NormalizarTipoMovimiento(Obj.TipoMovimiento)) + "' "
                        + "AND A.[CodTuberia] <> N'" + SqlTexto(Obj.CodTuberia) + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT [CodTuberia],[Version] FROM Tuberia_LOG UNION ALL SELECT [CodTuberia],[Version] FROM Tuberia) A "
                        + "WHERE A.[CodTuberia]=N'" + SqlTexto(CodKey) + "'";
                case TipoDAL.Log:
                    return SelectLogBase()
                      + "FROM (" + SelectUnionLog("Tuberia_LOG") + " UNION ALL " + SelectUnionLog("Tuberia") + ") A "
                      + JoinBase()
                      + "WHERE A.[CodTuberia] = N'" + SqlTexto(CodKey) + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodTuberia],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[CodTipoProducto],ISNULL(TP.[Descripcion], '') AS [TipoProducto],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[Ubicacion],A.[TramoLinea],"
                + "A.[DiametroInicio],A.[DiametroFinal],A.[Volumen],A.[FechaCertificacion],A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],A.[TipoMovimiento],A.[Comentario],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM Tuberia A "
                + JoinBase();
        }

        private string SelectLogBase()
        {
            return "SELECT A.[CodTuberia],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[CodTipoProducto],ISNULL(TP.[Descripcion], '') AS [TipoProducto],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[Ubicacion],A.[TramoLinea],"
                + "A.[DiametroInicio],A.[DiametroFinal],A.[Volumen],A.[FechaCertificacion],A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],A.[TipoMovimiento],A.[Comentario],"
                + "A.[Estatus],A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] ";
        }

        private string JoinBase()
        {
            return "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + "LEFT JOIN TipoProducto TP ON A.[CodTipoProducto] = TP.[CodTipoProducto] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] ";
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodTuberia],[CodTanque],[CodTipoProducto],[CodProducto],[Ubicacion],[TramoLinea],"
                + "[DiametroInicio],[DiametroFinal],[Volumen],[FechaCertificacion],[CodCompaniaInspeccion],[TipoMovimiento],[Comentario],[Estatus],[Version],"
                + "[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog] "
                + "FROM " + tabla;
        }

        private string QueryListado(PaginacionParametros paginacion)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codTuberia"] = "A.[CodTuberia]",
                ["codTanque"] = "A.[CodTanque]",
                ["tanque"] = "T.[Tanque]",
                ["codTipoProducto"] = "A.[CodTipoProducto]",
                ["tipoProducto"] = "TP.[Descripcion]",
                ["codProducto"] = "A.[CodProducto]",
                ["producto"] = "P.[Producto]",
                ["ubicacion"] = "A.[Ubicacion]",
                ["tramoLinea"] = "A.[TramoLinea]",
                ["diametroInicio"] = "A.[DiametroInicio]",
                ["diametro"] = "A.[DiametroInicio]",
                ["diametroFinal"] = "A.[DiametroFinal]",
                ["volumen"] = "A.[Volumen]",
                ["fechaCertificacion"] = "A.[FechaCertificacion]",
                ["codCompaniaInspeccion"] = "A.[CodCompaniaInspeccion]",
                ["companiaInspeccion"] = "CI.[NombreComercial]",
                ["tipoMovimiento"] = "A.[TipoMovimiento]",
                ["comentario"] = "A.[Comentario]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodTuberia])",
                    "CONVERT(VARCHAR(20), A.[CodTanque])",
                    "T.[Tanque]",
                    "A.[CodTipoProducto]",
                    "TP.[Descripcion]",
                    "CONVERT(VARCHAR(20), A.[CodProducto])",
                    "P.[Producto]",
                    "A.[Ubicacion]",
                    "A.[TramoLinea]",
                    "CONVERT(VARCHAR(30), A.[DiametroInicio])",
                    "CONVERT(VARCHAR(30), A.[DiametroFinal])",
                    "CONVERT(VARCHAR(30), A.[Volumen])",
                    "CONVERT(VARCHAR(10), A.[FechaCertificacion], 103)",
                    "CONVERT(VARCHAR(10), A.[FechaCertificacion], 120)",
                    "CONVERT(VARCHAR(20), A.[CodCompaniaInspeccion])",
                    "CI.[NombreComercial]",
                    "A.[TipoMovimiento]",
                    "A.[Comentario]",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodTuberia] ASC");

            return "SELECT A.[CodTuberia],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[CodTipoProducto],ISNULL(TP.[Descripcion], '') AS [TipoProducto],A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[Ubicacion],A.[TramoLinea],"
                + "A.[DiametroInicio],A.[DiametroFinal],A.[Volumen],A.[FechaCertificacion],A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],A.[TipoMovimiento],A.[Comentario],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Tuberia A "
                + JoinBase()
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryResumenPorProducto()
        {
            return "SELECT A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "COUNT(1) AS [CantidadTuberias],SUM(ISNULL(A.[Volumen], 0)) AS [VolumenTotal] "
                + "FROM Tuberia A "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "GROUP BY A.[CodProducto],P.[Producto] "
                + "ORDER BY ISNULL(P.[Producto], '')";
        }

        internal TuberiaAdjuntoDTO ObtenerAdjunto(string CodTuberia, int CodTuberiaAdjunto)
        {
            if (!ExisteTablaAdjuntos())
                return new TuberiaAdjuntoDTO();

            return ObjDAL
                .EjecutarReader(QueryObtenerAdjunto(CodTuberia, CodTuberiaAdjunto), MapAdjunto)
                .FirstOrDefault()
                ?? new TuberiaAdjuntoDTO();
        }

        internal byte[] LeerArchivoAdjunto(TuberiaAdjuntoDTO adjunto)
        {
            if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(adjunto.RutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        private List<TuberiaAdjuntoDTO> ListarAdjuntos(string CodTuberia)
        {
            if (!ExisteTablaAdjuntos())
                return new List<TuberiaAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(CodTuberia), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(TuberiaDTO Obj)
        {
            Obj.Adjuntos ??= new List<TuberiaAdjuntoDTO>();

            if (Obj.Adjuntos.Count == 0 && !ExisteTablaAdjuntos())
                return Ok();

            if (!ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de tuberia no existe.");

            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(TuberiaDTO Obj)
        {
            Obj.Adjuntos ??= new List<TuberiaAdjuntoDTO>();

            if (Obj.Adjuntos.Count > 0 && !ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de tuberia no existe.");

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("La tuberia puede tener maximo " + MaxAdjuntos + " archivos.");

            List<TuberiaAdjuntoDTO> adjuntos = new List<TuberiaAdjuntoDTO>();
            foreach (TuberiaAdjuntoDTO adjunto in Obj.Adjuntos)
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
                    adjunto.RutaArchivo = GuardarArchivoFisico(Obj.CodTuberia, adjunto, contenido);
                    adjunto.ContenidoBase64 = "";
                }
                else if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                {
                    return Error("El archivo es requerido.");
                }

                adjunto.CodTuberia = Obj.CodTuberia;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.TuberiaAdjunto')");
        }

        private string QueryListarAdjuntos(string CodTuberia)
        {
            return "SELECT CodTuberiaAdjunto,CodTuberiaArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.TuberiaAdjunto "
                + "WHERE CodTuberiaArchivo=N'" + SqlTexto(CodTuberia) + "' "
                + "ORDER BY CodTuberiaAdjunto";
        }

        private string QueryObtenerAdjunto(string CodTuberia, int CodTuberiaAdjunto)
        {
            return "SELECT CodTuberiaAdjunto,CodTuberiaArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.TuberiaAdjunto "
                + "WHERE CodTuberiaArchivo=N'" + SqlTexto(CodTuberia) + "' "
                + "AND CodTuberiaAdjunto='" + CodTuberiaAdjunto + "'";
        }

        private string QueryGuardarAdjuntos(TuberiaDTO Obj)
        {
            string sql = "DELETE FROM dbo.TuberiaAdjunto "
                + "WHERE CodTuberiaArchivo=N'" + SqlTexto(Obj.CodTuberia) + "'; "
                + "DECLARE @CodTuberiaAdjunto INT; ";

            foreach (TuberiaAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.TuberiaAdjunto'), 'CodTuberiaAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.TuberiaAdjunto "
                    + "(CodTuberiaArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(N'"
                    + SqlTexto(Obj.CodTuberia) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodTuberiaAdjunto = ISNULL(MAX(CodTuberiaAdjunto), 0) + 1 "
                    + "FROM dbo.TuberiaAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.TuberiaAdjunto "
                    + "(CodTuberiaAdjunto,CodTuberiaArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(@CodTuberiaAdjunto,N'"
                    + SqlTexto(Obj.CodTuberia) + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END ";
            }

            return sql;
        }

        private string GuardarArchivoFisico(string CodTuberia, TuberiaAdjuntoDTO adjunto, byte[] contenido)
        {
            string carpeta = CarpetaAdjuntos();
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionPermitida(adjunto.NombreArchivo, adjunto.TipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(adjunto.NombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string nombreArchivo = "TB" + CodTuberia + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "Tuberias", nombreArchivo);
        }

        private string CarpetaAdjuntos()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "Tuberias");
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

        private TuberiaAdjuntoDTO MapAdjunto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TuberiaAdjuntoDTO adjunto = new TuberiaAdjuntoDTO
            {
                CodTuberiaAdjunto = Int(reader["CodTuberiaAdjunto"]),
                CodTuberia = reader["CodTuberiaArchivo"].ToString() ?? "",
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoContenido(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = Long(reader["TamanoBytes"]),
                RutaArchivo = reader["RutaArchivo"].ToString() ?? ""
            };

            return adjunto;
        }

        private TuberiaDTO MapTuberia(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TuberiaDTO Obj = new TuberiaDTO();
            Obj.CodTuberia = (reader["CodTuberia"]?.ToString() ?? "").Trim();
            Obj.IdTuberia = ObjEncriptacion.Encriptar(Obj.CodTuberia);
            Obj.CodTanque = reader["CodTanque"].ToString() ?? "";

            if (!string.IsNullOrWhiteSpace(Obj.CodTanque))
                Obj.IdTanque = ObjEncriptacion.Encriptar(Obj.CodTanque);

            Obj.Tanque = reader["Tanque"].ToString() ?? "";
            Obj.CodTipoProducto = reader["CodTipoProducto"].ToString() ?? "";
            Obj.IdTipoProducto = ObjEncriptacion.Encriptar(Obj.CodTipoProducto);
            Obj.TipoProducto = reader["TipoProducto"].ToString() ?? "";
            Obj.CodProducto = reader["CodProducto"].ToString() ?? "";
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto);
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.Ubicacion = reader["Ubicacion"].ToString() ?? "";
            Obj.TramoLinea = reader["TramoLinea"].ToString() ?? "";
            Obj.DiametroInicio = DecimalValor(reader["DiametroInicio"]);
            Obj.DiametroFinal = DecimalValor(reader["DiametroFinal"]);
            Obj.Volumen = DecimalValor(reader["Volumen"]);
            Obj.FechaCertificacion = Fecha(reader["FechaCertificacion"]);
            Obj.CodCompaniaInspeccion = Convert.ToInt32(reader["CodCompaniaInspeccion"]);
            Obj.IdCompaniaInspeccion = ObjEncriptacion.Encriptar(Obj.CodCompaniaInspeccion.ToString());
            Obj.CompaniaInspeccion = reader["CompaniaInspeccion"].ToString() ?? "";
            Obj.TipoMovimiento = reader["TipoMovimiento"].ToString() ?? "";
            Obj.Comentario = reader["Comentario"].ToString() ?? "";
            Obj.Estatus = Bool(reader["Estatus"], true);
            return Obj;
        }

        private TuberiaDTO MapTuberiaLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TuberiaDTO Obj = MapTuberia(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString() ?? "";

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion);

            Obj.FechaCreacion = Fecha(reader["FechaCreacion"]);
            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString() ?? "";

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion);

            Obj.FechaActualizacion = Fecha(reader["FechaActualizacion"]);
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private TuberiaResumenProductoDTO MapResumenProducto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            TuberiaResumenProductoDTO Obj = new TuberiaResumenProductoDTO();
            Obj.CodProducto = reader["CodProducto"].ToString() ?? "";

            if (!string.IsNullOrWhiteSpace(Obj.CodProducto))
                Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto);

            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CantidadTuberias = Int(reader["CantidadTuberias"]);
            Obj.VolumenTotal = DecimalValor(reader["VolumenTotal"]);
            return Obj;
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string NormalizarTipoMovimiento(string? valor)
        {
            return (valor ?? "").Trim().ToUpperInvariant();
        }

        private string SqlNumero(decimal valor)
        {
            return valor.ToString(CultureInfo.InvariantCulture);
        }

        private string SqlIntNullable(int valor)
        {
            return valor > 0 ? "'" + valor + "'" : "NULL";
        }

        private string SqlTextoNullable(string? valor)
        {
            string texto = (valor ?? "").Trim();
            return string.IsNullOrWhiteSpace(texto) ? "NULL" : "N'" + SqlTexto(texto) + "'";
        }

        private string SqlFecha(DateTime? valor)
        {
            return valor.HasValue ? "'" + valor.Value.ToString("yyyyMMdd", CultureInfo.InvariantCulture) + "'" : "NULL";
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

        private decimal DecimalValor(object valor)
        {
            if (valor == DBNull.Value)
                return 0m;

            return Convert.ToDecimal(valor);
        }

        private bool Bool(object valor, bool valorPorDefecto = false)
        {
            if (valor == DBNull.Value)
                return valorPorDefecto;

            return Convert.ToBoolean(valor);
        }

        private DateTime? Fecha(object valor)
        {
            if (valor == DBNull.Value)
                return null;

            if (DateTime.TryParse(valor.ToString(), out DateTime fecha))
                return fecha;

            return null;
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
