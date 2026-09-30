using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace app.Models.CapacidadVolumetricaTanque
{
    /// <summary>
    /// DAO para el mantenimiento de documentos de capacidad volumetrica de tanque.
    /// </summary>
    internal partial class CapacidadVolumetricaTanqueDAO
    {
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

        internal PaginacionResultado<CapacidadVolumetricaTanqueDTO> Listado(int page = 1, int pageSize = 50, string search = "", string sort = "", string CodTanque = "", bool SoloActuales = false, bool SoloHistoricas = false)
        {
            AsegurarTablas();
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<CapacidadVolumetricaTanqueDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, CodTanque, SoloActuales, SoloHistoricas), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapCapacidadVolumetricaTanque(reader);
            });

            return new PaginacionResultado<CapacidadVolumetricaTanqueDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            AsegurarTablas();
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodCapacidadVolumetricaTanque"].ToString()
            });
        }

        internal CapacidadVolumetricaTanqueDTO Obtener(int CodCapacidadVolumetricaTanque)
        {
            MsjDB tablas = AsegurarTablas();
            CapacidadVolumetricaTanqueDTO obj = ObjDAL
                .EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodCapacidadVolumetricaTanque), MapCapacidadVolumetricaTanque)
                .FirstOrDefault()
                ?? new CapacidadVolumetricaTanqueDTO();

            if (obj.CodCapacidadVolumetricaTanque > 0)
            {
                obj.Detalles = ObtenerDetalles(obj.CodCapacidadVolumetricaTanque);
                if (tablas.Estatus)
                {
                    obj.DetallesBase = ObtenerDetallesBase(obj.CodCapacidadVolumetricaTanque);
                    obj.DetallesFracciones = ObtenerDetallesFracciones(obj.CodCapacidadVolumetricaTanque);
                    CompletarDetallesWizardDesdeDetalleFinal(obj);
                }
                obj.Adjuntos = ListarAdjuntos(obj.CodCapacidadVolumetricaTanque);
                obj.AdjuntoCantidad = obj.Adjuntos.Count;
            }

            return obj;
        }

        internal CapacidadVolumetricaTanqueDTO ObtenerResumen(int CodCapacidadVolumetricaTanque)
        {
            AsegurarTablas();
            return ObjDAL
                .EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodCapacidadVolumetricaTanque), MapCapacidadVolumetricaTanque)
                .FirstOrDefault()
                ?? new CapacidadVolumetricaTanqueDTO();
        }

        internal PaginacionResultado<CapacidadVolumetricaTanqueDetalleDTO> ListadoDetalles(
            int CodCapacidadVolumetricaTanque,
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "",
            int? Pies = null,
            int? Pulgadas = null,
            int? Dieciseisavos = null)
        {
            AsegurarTablas();
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<CapacidadVolumetricaTanqueDetalleDTO> items = ObjDAL.EjecutarReader(
                QueryListadoDetalles(CodCapacidadVolumetricaTanque, paginacion, Pies, Pulgadas, Dieciseisavos),
                reader =>
                {
                    if (totalCount == 0)
                        totalCount = PaginacionSql.LeerTotal(reader);

                    return MapDetalle(reader);
                });

            return new PaginacionResultado<CapacidadVolumetricaTanqueDetalleDTO>(
                items,
                totalCount,
                paginacion.Page,
                paginacion.PageSize);
        }

        internal int ObtenerKey()
        {
            AsegurarTablas();
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(CapacidadVolumetricaTanqueDTO Obj)
        {
            MsjDB tablas = AsegurarTablas();
            if (!tablas.Estatus)
                return tablas;

            Obj.CodCapacidadVolumetricaTanque = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionWizard = PrepararDetallesWizard(Obj);
            if (!validacionWizard.Estatus)
                return validacionWizard;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("CapacidadVolumetricaTanque", "CREADO", "CodCapacidadVolumetricaTanque:" + Obj.CodCapacidadVolumetricaTanque, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(CapacidadVolumetricaTanqueDTO Obj)
        {
            MsjDB tablas = AsegurarTablas();
            if (!tablas.Estatus)
                return tablas;

            CapacidadVolumetricaTanqueDTO ObjAnterior = Obtener(Obj.CodCapacidadVolumetricaTanque);
            Obj.Version = ObtenerVersion(Obj.CodCapacidadVolumetricaTanque);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionWizard = PrepararDetallesWizard(Obj);
            if (!validacionWizard.Estatus)
                return validacionWizard;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("CapacidadVolumetricaTanque", "EDITADO", "CodCapacidadVolumetricaTanque:" + Obj.CodCapacidadVolumetricaTanque, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(CapacidadVolumetricaTanqueDTO Obj)
        {
            MsjDB tablas = AsegurarTablas();
            if (!tablas.Estatus)
                return tablas;

            CapacidadVolumetricaTanqueDTO ObjAnterior = Obtener(Obj.CodCapacidadVolumetricaTanque);
            Obj.Version = ObtenerVersion(Obj.CodCapacidadVolumetricaTanque);
            Obj.CodUsuarioEliminacion = new VerificarUsuario().SesionUsuario();
            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("CapacidadVolumetricaTanque", "ELIMINADO", "CodCapacidadVolumetricaTanque:" + Obj.CodCapacidadVolumetricaTanque, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal MsjDB ImportarPlantilla(string CodTanque, int CodProducto, int CodCompaniaInspeccion, DateTime FechaCalibracion, string Comentarios, List<CapacidadVolumetricaTanqueDetalleDTO> detalles)
        {
            CapacidadVolumetricaTanqueDTO obj = new CapacidadVolumetricaTanqueDTO
            {
                CodTanque = CodTanque,
                CodProducto = CodProducto,
                CodCompaniaInspeccion = CodCompaniaInspeccion,
                FechaCalibracion = FechaCalibracion,
                Comentarios = Comentarios,
                Detalles = detalles
            };

            MsjDB = Agregar(obj);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar(
                    "CapacidadVolumetricaTanque",
                    "ImportarPlantilla",
                    "CodTanque:" + CodTanque + "|CodProducto:" + CodProducto,
                    Descripcion: "Documento creado con detalles importados: " + detalles.Count);
            }

            return MsjDB;
        }

        /// <summary>
        /// Importa una calibracion directamente al encabezado y al detalle final.
        /// Este flujo no genera ni utiliza los detalles del wizard.
        /// </summary>
        internal MsjDB ImportarPlantillaDirecta(string CodTanque, int CodProducto, int CodCompaniaInspeccion, DateTime FechaCalibracion, string Comentarios, List<CapacidadVolumetricaTanqueDetalleDTO> detalles)
        {
            MsjDB tablas = AsegurarTablasPrincipales();
            if (!tablas.Estatus)
                return tablas;

            CapacidadVolumetricaTanqueDTO obj = new CapacidadVolumetricaTanqueDTO
            {
                CodCapacidadVolumetricaTanque = ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1),
                CodTanque = CodTanque,
                CodProducto = CodProducto,
                CodCompaniaInspeccion = CodCompaniaInspeccion,
                FechaCalibracion = FechaCalibracion,
                Comentarios = Comentarios,
                Detalles = detalles,
                Version = 1,
                CodUsuarioCreacion = new VerificarUsuario().SesionUsuario()
            };

            MsjDB = ObjDAL.Ejecutar(QueryAgregarPlantillaDirecta(obj), Key: false, tipoDAL: TipoDAL.Agregar);
            if (MsjDB.Estatus)
            {
                LogModificacionDAO.Registrar(
                    "CapacidadVolumetricaTanque",
                    "ImportarPlantillaDirecta",
                    "CodTanque:" + CodTanque + "|CodProducto:" + CodProducto,
                    Descripcion: "Documento de aditivo creado con detalles importados directamente: " + detalles.Count);
            }

            return MsjDB;
        }

        internal int ObtenerProductoTanque(string CodTanque)
        {
            return ObjDAL.EjecutarScalar(
                "SELECT ISNULL(T.[CodProducto], 0) FROM Tanque T "
                + "INNER JOIN Producto P ON P.[CodProducto] = T.[CodProducto] "
                + "WHERE T.[CodTanque] = " + SqlTextoLiteral(CodTanque) + " "
                + "AND ISNULL(T.[Estatus], 1) = 1 AND ISNULL(P.[Estatus], 1) = 1",
                0);
        }

        internal bool VerificarCapacidadVolumetricaTanque(CapacidadVolumetricaTanqueDTO Obj)
        {
            AsegurarTablas();
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodCapacidadVolumetricaTanque)
        {
            AsegurarTablas();
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodCapacidadVolumetricaTanque), 1);
        }

        internal List<CapacidadVolumetricaTanqueDTO> Log(int CodCapacidadVolumetricaTanque)
        {
            AsegurarTablas();
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodCapacidadVolumetricaTanque), MapCapacidadVolumetricaTanqueLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, CapacidadVolumetricaTanqueDTO Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return QueryAgregar(Obj);
                case TipoDAL.Editar:
                    return QueryEditar(Obj);
                case TipoDAL.Eliminar:
                    return QueryEliminar(Obj);
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return "SELECT A.[CodCapacidadVolumetricaTanque], CONCAT(ISNULL(T.[Tanque], ''), ' - ', ISNULL(P.[Producto], ''), ' - ', CONVERT(VARCHAR(10), A.[FechaCalibracion], 103)) AS [Descripcion] "
                        + "FROM CapacidadVolumetricaTanque A "
                        + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                        + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                        + "WHERE ISNULL(A.[Estatus], 1) = 1 ";
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodCapacidadVolumetricaTanque]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodCapacidadVolumetricaTanque]),0)+1 as 'CodCapacidadVolumetricaTanque' FROM CapacidadVolumetricaTanque A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM CapacidadVolumetricaTanque A "
                        + "WHERE A.[CodTanque]=N'" + SqlTexto(Obj.CodTanque) + "' "
                        + "AND A.[CodProducto]='" + Obj.CodProducto + "' "
                        + "AND A.[FechaCalibracion]=" + SqlFecha(Obj.FechaCalibracion) + " "
                        + "AND A.[CodCapacidadVolumetricaTanque] <> '" + Obj.CodCapacidadVolumetricaTanque + "' "
                        + "AND ISNULL(A.[Estatus], 1) = 1";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (" + SelectUnionLog("CapacidadVolumetricaTanque_LOG") + " UNION ALL " + SelectUnionLog("CapacidadVolumetricaTanque") + ") A " +
                        "WHERE A.[CodCapacidadVolumetricaTanque]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodCapacidadVolumetricaTanque], A.[CodTanque], ISNULL(T.[Tanque], '') AS [Tanque], "
                      + "A.[CodProducto], ISNULL(P.[Producto], '') AS [Producto], "
                      + "A.[CodCompaniaInspeccion], ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion], "
                      + "A.[FechaCalibracion], A.[Comentarios], A.[EsActual],"
                      + "A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus],"
                      + "0 AS [DetalleCantidad],0 AS [AdjuntoCantidad] "
                      + "FROM (" + SelectUnionLog("CapacidadVolumetricaTanque_LOG") + " UNION ALL " + SelectUnionLog("CapacidadVolumetricaTanque") + ") A "
                      + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                      + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                      + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] "
                      + "WHERE A.[CodCapacidadVolumetricaTanque] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectUnionLog(string tabla)
        {
            return "SELECT [CodCapacidadVolumetricaTanque],[CodTanque],[CodProducto],[CodCompaniaInspeccion],[FechaCalibracion],[Comentarios],[EsActual],[Estatus],[Version],[CodUsuarioCreacion],[FechaCreacion],[CodUsuarioActualizacion],[FechaActualizacion],[CodUsuarioEliminacion],[FechaEliminacion],[AccionLog] FROM " + tabla;
        }

        private string QueryAgregar(CapacidadVolumetricaTanqueDTO Obj)
        {
            string CodUsuario = SqlTexto(Obj.CodUsuarioCreacion);
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("INSERT INTO CapacidadVolumetricaTanque ")
                .Append("(CodCapacidadVolumetricaTanque,CodTanque,CodProducto,CodCompaniaInspeccion,FechaCalibracion,Comentarios,EsActual,Version,CodUsuarioCreacion,FechaCreacion) VALUES(")
                .Append("'").Append(Obj.CodCapacidadVolumetricaTanque).Append("',")
                .Append(SqlTextoLiteral(Obj.CodTanque)).Append(",")
                .Append("'").Append(Obj.CodProducto).Append("',")
                .Append("'").Append(Obj.CodCompaniaInspeccion).Append("',")
                .Append(SqlFecha(Obj.FechaCalibracion)).Append(",")
                .Append("'").Append(SqlTexto(Obj.Comentarios)).Append("',")
                .Append(EsActualInicialSql(Obj)).Append(",")
                .Append("'1',")
                .Append("'").Append(CodUsuario).Append("',")
                .Append("GETDATE()); ");
            query.Append(InsertarDetallesBaseSql(Obj.CodCapacidadVolumetricaTanque, Obj.DetallesBase, CodUsuario, Obj.Version, "C"));
            query.Append(InsertarDetallesFraccionesSql(Obj.CodCapacidadVolumetricaTanque, Obj.DetallesFracciones, CodUsuario, Obj.Version, "C"));
            query.Append(InsertarDetallesSql(Obj.CodCapacidadVolumetricaTanque, Obj.Detalles, CodUsuario, Obj.Version, "C"));
            query.Append(RecalcularActualSql(SqlTextoLiteral(Obj.CodTanque), Obj.CodProducto.ToString(CultureInfo.InvariantCulture), CodUsuario));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryAgregarPlantillaDirecta(CapacidadVolumetricaTanqueDTO Obj)
        {
            string CodUsuario = SqlTexto(Obj.CodUsuarioCreacion);
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("INSERT INTO CapacidadVolumetricaTanque ")
                .Append("(CodCapacidadVolumetricaTanque,CodTanque,CodProducto,CodCompaniaInspeccion,FechaCalibracion,Comentarios,EsActual,Version,CodUsuarioCreacion,FechaCreacion) VALUES(")
                .Append("'").Append(Obj.CodCapacidadVolumetricaTanque).Append("',")
                .Append(SqlTextoLiteral(Obj.CodTanque)).Append(",")
                .Append("'").Append(Obj.CodProducto).Append("',")
                .Append("'").Append(Obj.CodCompaniaInspeccion).Append("',")
                .Append(SqlFecha(Obj.FechaCalibracion)).Append(",")
                .Append("'").Append(SqlTexto(Obj.Comentarios)).Append("',")
                .Append(EsActualInicialSql(Obj)).Append(",")
                .Append("'1', '").Append(CodUsuario).Append("', GETDATE()); ");
            query.Append(InsertarDetallesSql(Obj.CodCapacidadVolumetricaTanque, Obj.Detalles, CodUsuario, Obj.Version, "C"));
            query.Append(RecalcularActualSql(SqlTextoLiteral(Obj.CodTanque), Obj.CodProducto.ToString(CultureInfo.InvariantCulture), CodUsuario));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryEditar(CapacidadVolumetricaTanqueDTO Obj)
        {
            string CodUsuario = SqlTexto(Obj.CodUsuarioActualizacion);
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append(CopiarLogActualSql(Obj.CodCapacidadVolumetricaTanque));
            query.Append("DECLARE @CodTanqueAnterior NVARCHAR(20) = (SELECT CodTanque FROM CapacidadVolumetricaTanque WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("'); ");
            query.Append("DECLARE @CodProductoAnterior INT = (SELECT CodProducto FROM CapacidadVolumetricaTanque WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("'); ");
            query.Append("UPDATE CapacidadVolumetricaTanque SET ")
                .Append("CodTanque=").Append(SqlTextoLiteral(Obj.CodTanque)).Append(",")
                .Append("CodProducto='").Append(Obj.CodProducto).Append("',")
                .Append("CodCompaniaInspeccion='").Append(Obj.CodCompaniaInspeccion).Append("',")
                .Append("FechaCalibracion=").Append(SqlFecha(Obj.FechaCalibracion)).Append(",")
                .Append("Comentarios='").Append(SqlTexto(Obj.Comentarios)).Append("',")
                .Append("Estatus=1,")
                .Append("Version=").Append(Obj.Version).Append(",")
                .Append("CodUsuarioActualizacion='").Append(CodUsuario).Append("',")
                .Append("FechaActualizacion=GETDATE(),")
                .Append("AccionLog='U' ")
                .Append("WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("'; ");
            query.Append(CopiarDetallesWizardLogSql(Obj.CodCapacidadVolumetricaTanque, "U", CodUsuario));
            query.Append("DELETE FROM CapacidadVolumetricaTanqueDetalle WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("' AND Estatus=1; ");
            query.Append("IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2', 'U') IS NOT NULL DELETE FROM CapacidadVolumetricaTanqueDetalle2 WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("' AND Estatus=1; ");
            query.Append("IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3', 'U') IS NOT NULL DELETE FROM CapacidadVolumetricaTanqueDetalle3 WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("' AND Estatus=1; ");
            query.Append(InsertarDetallesBaseSql(Obj.CodCapacidadVolumetricaTanque, Obj.DetallesBase, CodUsuario, Obj.Version, "U"));
            query.Append(InsertarDetallesFraccionesSql(Obj.CodCapacidadVolumetricaTanque, Obj.DetallesFracciones, CodUsuario, Obj.Version, "U"));
            query.Append(InsertarDetallesSql(Obj.CodCapacidadVolumetricaTanque, Obj.Detalles, CodUsuario, Obj.Version, "U"));
            query.Append("IF ISNULL(@CodTanqueAnterior, N'') <> ").Append(SqlTextoLiteral(Obj.CodTanque)).Append(" OR ISNULL(@CodProductoAnterior, 0) <> '").Append(Obj.CodProducto).Append("' ")
                .Append(RecalcularActualSql("@CodTanqueAnterior", "@CodProductoAnterior", CodUsuario));
            query.Append(RecalcularActualSql(SqlTextoLiteral(Obj.CodTanque), Obj.CodProducto.ToString(CultureInfo.InvariantCulture), CodUsuario));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string QueryEliminar(CapacidadVolumetricaTanqueDTO Obj)
        {
            string CodUsuario = Obj.CodUsuarioEliminacion ?? new VerificarUsuario().SesionUsuario();
            StringBuilder query = new StringBuilder();
            query.Append("BEGIN TRY BEGIN TRANSACTION; ");
            query.Append("DECLARE @CodTanqueAnterior NVARCHAR(20) = (SELECT CodTanque FROM CapacidadVolumetricaTanque WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("'); ");
            query.Append("DECLARE @CodProductoAnterior INT = (SELECT CodProducto FROM CapacidadVolumetricaTanque WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("'); ");
            query.Append(CopiarEliminacionLogSql(Obj.CodCapacidadVolumetricaTanque, Obj.Version, CodUsuario));
            query.Append(CopiarDetallesWizardLogSql(Obj.CodCapacidadVolumetricaTanque, "D", CodUsuario));
            query.Append("DELETE FROM CapacidadVolumetricaTanqueDetalle WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("' AND Estatus=1; ");
            query.Append("IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2', 'U') IS NOT NULL DELETE FROM CapacidadVolumetricaTanqueDetalle2 WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("' AND Estatus=1; ");
            query.Append("IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3', 'U') IS NOT NULL DELETE FROM CapacidadVolumetricaTanqueDetalle3 WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("' AND Estatus=1; ");
            query.Append("IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueAdjunto', 'U') IS NOT NULL DELETE FROM dbo.CapacidadVolumetricaTanqueAdjunto WHERE CodCapacidadVolumetricaTanqueArchivo='").Append(Obj.CodCapacidadVolumetricaTanque).Append("'; ");
            query.Append("DELETE FROM CapacidadVolumetricaTanque WHERE CodCapacidadVolumetricaTanque='").Append(Obj.CodCapacidadVolumetricaTanque).Append("'; ");
            query.Append(RecalcularActualSql("@CodTanqueAnterior", "@CodProductoAnterior", CodUsuario));
            query.Append("COMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW; END CATCH");
            return query.ToString();
        }

        private string SelectBase()
        {
            return "SELECT A.[CodCapacidadVolumetricaTanque],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[FechaCalibracion],A.[Comentarios],A.[EsActual],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "(SELECT COUNT(1) FROM CapacidadVolumetricaTanqueDetalle D WHERE D.[CodCapacidadVolumetricaTanque] = A.[CodCapacidadVolumetricaTanque] AND D.[Estatus] = 1) AS [DetalleCantidad], "
                + AdjuntosCantidadSql() + " AS [AdjuntoCantidad] "
                + "FROM CapacidadVolumetricaTanque A "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] ";
        }

        private string QueryListado(PaginacionParametros paginacion, string CodTanque = "", bool SoloActuales = false, bool SoloHistoricas = false)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codCapacidadVolumetricaTanque"] = "A.[CodCapacidadVolumetricaTanque]",
                ["codTanque"] = "A.[CodTanque]",
                ["tanque"] = "T.[Tanque]",
                ["codProducto"] = "A.[CodProducto]",
                ["producto"] = "P.[Producto]",
                ["codCompaniaInspeccion"] = "A.[CodCompaniaInspeccion]",
                ["companiaInspeccion"] = "CI.[NombreComercial]",
                ["fechaCalibracion"] = "A.[FechaCalibracion]",
                ["comentarios"] = "A.[Comentarios]",
                ["esActual"] = "A.[EsActual]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + (!string.IsNullOrWhiteSpace(CodTanque) ? "AND A.[CodTanque] = N'" + SqlTexto(CodTanque) + "' " : "")
                + (SoloActuales ? "AND ISNULL(A.[Estatus], 1) = 1 AND A.[EsActual] = 1 " : "")
                + (SoloHistoricas ? "AND ISNULL(A.[Estatus], 1) = 1 AND ISNULL(A.[EsActual], 0) = 0 " : "")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodCapacidadVolumetricaTanque])",
                    "CONVERT(VARCHAR(20), A.[CodTanque])",
                    "T.[Tanque]",
                    "CONVERT(VARCHAR(20), A.[CodProducto])",
                    "P.[Producto]",
                    "CONVERT(VARCHAR(20), A.[CodCompaniaInspeccion])",
                    "CI.[NombreComercial]",
                    "CONVERT(VARCHAR(10), A.[FechaCalibracion], 103)",
                    "A.[Comentarios]",
                    "CONVERT(VARCHAR(5), A.[EsActual])",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = "A.[EsActual] DESC, "
                + PaginacionSql.OrderBy(
                    paginacion.Sort,
                    sortColumns,
                    "A.[FechaCalibracion] DESC, A.[CodCapacidadVolumetricaTanque] DESC"
                );

            return "SELECT A.[CodCapacidadVolumetricaTanque],A.[CodTanque],ISNULL(T.[Tanque], '') AS [Tanque],"
                + "A.[CodProducto],ISNULL(P.[Producto], '') AS [Producto],"
                + "A.[CodCompaniaInspeccion],ISNULL(CI.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[FechaCalibracion],A.[Comentarios],A.[EsActual],ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "(SELECT COUNT(1) FROM CapacidadVolumetricaTanqueDetalle D WHERE D.[CodCapacidadVolumetricaTanque] = A.[CodCapacidadVolumetricaTanque] AND D.[Estatus] = 1) AS [DetalleCantidad], "
                + AdjuntosCantidadSql() + " AS [AdjuntoCantidad], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM CapacidadVolumetricaTanque A "
                + "LEFT JOIN Tanque T ON A.[CodTanque] = T.[CodTanque] "
                + "LEFT JOIN Producto P ON A.[CodProducto] = P.[CodProducto] "
                + "LEFT JOIN CompaniaInspeccion CI ON A.[CodCompaniaInspeccion] = CI.[CodCompaniaInspeccion] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private List<CapacidadVolumetricaTanqueDetalleDTO> ObtenerDetalles(int CodCapacidadVolumetricaTanque)
        {
            return ObjDAL.EjecutarReader(QueryDetalles(CodCapacidadVolumetricaTanque), MapDetalle);
        }

        private string QueryDetalles(int CodCapacidadVolumetricaTanque)
        {
            return "SELECT [CodCapacidadVolumetricaTanqueDetalle],[CodCapacidadVolumetricaTanque],[Pies],[Pulgadas],[Dieciseisavos],[Volumen] "
                + "FROM CapacidadVolumetricaTanqueDetalle "
                + "WHERE [CodCapacidadVolumetricaTanque]='" + CodCapacidadVolumetricaTanque + "' AND [Estatus] = 1 "
                + "ORDER BY [Pies], [Pulgadas], [Dieciseisavos]";
        }

        private string QueryListadoDetalles(
            int CodCapacidadVolumetricaTanque,
            PaginacionParametros paginacion,
            int? Pies = null,
            int? Pulgadas = null,
            int? Dieciseisavos = null)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["pies"] = "D.[Pies]",
                ["pulgadas"] = "D.[Pulgadas]",
                ["dieciseisavos"] = "D.[Dieciseisavos]",
                ["volumen"] = "D.[Volumen]"
            };

            string filtrosMedida = "";
            if (Pies.HasValue)
                filtrosMedida += "AND D.[Pies] = " + Pies.Value + " ";
            if (Pulgadas.HasValue)
                filtrosMedida += "AND D.[Pulgadas] = " + Pulgadas.Value + " ";
            if (Dieciseisavos.HasValue)
                filtrosMedida += "AND D.[Dieciseisavos] = " + Dieciseisavos.Value + " ";

            string? filtroAltura = FiltroBusquedaAltura(paginacion.Search);
            string where = "WHERE D.[CodCapacidadVolumetricaTanque] = '" + CodCapacidadVolumetricaTanque + "' AND D.[Estatus] = 1 "
                + filtrosMedida
                + (string.IsNullOrWhiteSpace(filtrosMedida) ? (filtroAltura ?? PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), D.[Pies])",
                    "CONVERT(VARCHAR(20), D.[Pulgadas])",
                    "CONVERT(VARCHAR(20), D.[Dieciseisavos])",
                    "CONVERT(VARCHAR(30), D.[Volumen])"
                })) : "");

            string orderBy = PaginacionSql.OrderBy(
                paginacion.Sort,
                sortColumns,
                "D.[Pies] ASC, D.[Pulgadas] ASC, D.[Dieciseisavos] ASC")
                + ", D.[CodCapacidadVolumetricaTanqueDetalle] ASC";

            return "SELECT D.[CodCapacidadVolumetricaTanqueDetalle],D.[CodCapacidadVolumetricaTanque],D.[Pies],D.[Pulgadas],D.[Dieciseisavos],D.[Volumen], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM CapacidadVolumetricaTanqueDetalle D "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private static string? FiltroBusquedaAltura(string search)
        {
            Match coincidenciaEspacios = Regex.Match(
                search ?? "",
                "^\\s*(?<pies>\\d+)\\s+(?<pulgadas>\\d+)\\s+(?<fraccion>\\d+)\\s+16\\s*$");
            Match coincidencia = coincidenciaEspacios.Success ? coincidenciaEspacios : Regex.Match(
                search ?? "",
                "^\\s*(?<pies>\\d+)\\s*['′]\\s*(?:(?<pulgadas>\\d+)\\s*[\\\"″])?(?:\\s+(?<fraccion>\\d+)\\s*/\\s*16)?\\s*$");

            if (!coincidencia.Success)
                return null;

            StringBuilder filtro = new StringBuilder("AND D.[Pies] = ");
            filtro.Append(coincidencia.Groups["pies"].Value);

            if (coincidencia.Groups["pulgadas"].Success)
                filtro.Append(" AND D.[Pulgadas] = ").Append(coincidencia.Groups["pulgadas"].Value);

            if (coincidencia.Groups["fraccion"].Success)
                filtro.Append(" AND D.[Dieciseisavos] = ").Append(coincidencia.Groups["fraccion"].Value);

            return filtro.Append(' ').ToString();
        }

        private string InsertarDetallesSql(int CodCapacidadVolumetricaTanque, List<CapacidadVolumetricaTanqueDetalleDTO> detalles, string CodUsuario, int Version, string AccionLog)
        {
            StringBuilder query = new StringBuilder();
            query.Append("DECLARE @NextDetalle INT = (SELECT ISNULL(MAX(A.[CodCapacidadVolumetricaTanqueDetalle]),0)+1 FROM CapacidadVolumetricaTanqueDetalle A WITH (TABLOCKX)); ");
            string accion = SqlTexto(AccionLog);

            for (int index = 0; index < detalles.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalleDTO item = detalles[index];
                query.Append("INSERT INTO CapacidadVolumetricaTanqueDetalle ")
                    .Append("(CodCapacidadVolumetricaTanqueDetalle,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES(")
                    .Append("@NextDetalle + ").Append(index).Append(",")
                    .Append("'").Append(CodCapacidadVolumetricaTanque).Append("',")
                    .Append("'").Append(item.Pies).Append("',")
                    .Append("'").Append(item.Pulgadas).Append("',")
                    .Append("'").Append(item.Dieciseisavos).Append("',")
                                        .Append(SqlNumero(item.Volumen)).Append(",")
                    .Append("1,")
                    .Append("'").Append(Version).Append("',")
                    .Append("'").Append(SqlTexto(CodUsuario)).Append("',")
                    .Append("GETDATE(),")
                    .Append("'").Append(accion).Append("'); ");
            }

            return query.ToString();
        }

        private List<CapacidadVolumetricaTanqueDetalle2DTO> ObtenerDetallesBase(int CodCapacidadVolumetricaTanque)
        {
            return ObjDAL.EjecutarReader(QueryDetallesBase(CodCapacidadVolumetricaTanque), MapDetalleBase);
        }

        private string QueryDetallesBase(int CodCapacidadVolumetricaTanque)
        {
            return "SELECT [CodCapacidadVolumetricaTanqueDetalle2],[CodCapacidadVolumetricaTanque],[Pies],[Pulgadas],[Volumen] "
                + "FROM CapacidadVolumetricaTanqueDetalle2 "
                + "WHERE [CodCapacidadVolumetricaTanque]='" + CodCapacidadVolumetricaTanque + "' AND [Estatus] = 1 "
                + "ORDER BY [Pies], [Pulgadas]";
        }

        private List<CapacidadVolumetricaTanqueDetalle3DTO> ObtenerDetallesFracciones(int CodCapacidadVolumetricaTanque)
        {
            return ObjDAL.EjecutarReader(QueryDetallesFracciones(CodCapacidadVolumetricaTanque), MapDetalleFraccion);
        }

        private string QueryDetallesFracciones(int CodCapacidadVolumetricaTanque)
        {
            return "SELECT [CodCapacidadVolumetricaTanqueDetalle3],[CodCapacidadVolumetricaTanque],[Dieciseisavos],[Volumen] "
                + "FROM CapacidadVolumetricaTanqueDetalle3 "
                + "WHERE [CodCapacidadVolumetricaTanque]='" + CodCapacidadVolumetricaTanque + "' AND [Estatus] = 1 "
                + "ORDER BY [Dieciseisavos]";
        }

        private string InsertarDetallesBaseSql(int CodCapacidadVolumetricaTanque, List<CapacidadVolumetricaTanqueDetalle2DTO> detalles, string CodUsuario, int Version, string AccionLog)
        {
            StringBuilder query = new StringBuilder();
            query.Append("IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2', 'U') IS NOT NULL BEGIN ");
            query.Append("DECLARE @NextDetalle2 INT = (SELECT ISNULL(MAX(A.[CodCapacidadVolumetricaTanqueDetalle2]),0)+1 FROM CapacidadVolumetricaTanqueDetalle2 A WITH (TABLOCKX)); ");
            string accion = SqlTexto(AccionLog);

            for (int index = 0; index < detalles.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalle2DTO item = detalles[index];
                query.Append("INSERT INTO CapacidadVolumetricaTanqueDetalle2 ")
                    .Append("(CodCapacidadVolumetricaTanqueDetalle2,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES(")
                    .Append("@NextDetalle2 + ").Append(index).Append(",")
                    .Append("'").Append(CodCapacidadVolumetricaTanque).Append("',")
                    .Append("'").Append(item.Pies).Append("',")
                    .Append("'").Append(item.Pulgadas).Append("',")
                    .Append(SqlNumero(item.Volumen)).Append(",")
                    .Append("1,")
                    .Append("'").Append(Version).Append("',")
                    .Append("'").Append(SqlTexto(CodUsuario)).Append("',")
                    .Append("GETDATE(),")
                    .Append("'").Append(accion).Append("'); ");
            }

            query.Append("END; ");
            return query.ToString();
        }

        private string InsertarDetallesFraccionesSql(int CodCapacidadVolumetricaTanque, List<CapacidadVolumetricaTanqueDetalle3DTO> detalles, string CodUsuario, int Version, string AccionLog)
        {
            StringBuilder query = new StringBuilder();
            query.Append("IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3', 'U') IS NOT NULL BEGIN ");
            query.Append("DECLARE @NextDetalle3 INT = (SELECT ISNULL(MAX(A.[CodCapacidadVolumetricaTanqueDetalle3]),0)+1 FROM CapacidadVolumetricaTanqueDetalle3 A WITH (TABLOCKX)); ");
            string accion = SqlTexto(AccionLog);

            for (int index = 0; index < detalles.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalle3DTO item = detalles[index];
                query.Append("INSERT INTO CapacidadVolumetricaTanqueDetalle3 ")
                    .Append("(CodCapacidadVolumetricaTanqueDetalle3,CodCapacidadVolumetricaTanque,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) VALUES(")
                    .Append("@NextDetalle3 + ").Append(index).Append(",")
                    .Append("'").Append(CodCapacidadVolumetricaTanque).Append("',")
                    .Append("'").Append(item.Dieciseisavos).Append("',")
                                        .Append(SqlNumero(item.Volumen)).Append(",")
                    .Append("1,")
                    .Append("'").Append(Version).Append("',")
                    .Append("'").Append(SqlTexto(CodUsuario)).Append("',")
                    .Append("GETDATE(),")
                    .Append("'").Append(accion).Append("'); ");
            }

            query.Append("END; ");
            return query.ToString();
        }

        private string CopiarLogActualSql(int CodCapacidadVolumetricaTanque)
        {
            return "INSERT INTO CapacidadVolumetricaTanque_LOG "
                + "(CodCapacidadVolumetricaTanque,CodTanque,CodProducto,CodCompaniaInspeccion,FechaCalibracion,Comentarios,EsActual,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodCapacidadVolumetricaTanque,CodTanque,CodProducto,CodCompaniaInspeccion,FechaCalibracion,Comentarios,EsActual,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog "
                + "FROM CapacidadVolumetricaTanque WHERE CodCapacidadVolumetricaTanque='" + CodCapacidadVolumetricaTanque + "'; "
                + "INSERT INTO CapacidadVolumetricaTanqueDetalle_LOG "
                + "(CodCapacidadVolumetricaTanqueDetalle,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodCapacidadVolumetricaTanqueDetalle,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog "
                + "FROM CapacidadVolumetricaTanqueDetalle WHERE CodCapacidadVolumetricaTanque='" + CodCapacidadVolumetricaTanque + "' AND Estatus=1; ";
        }

        private string CopiarEliminacionLogSql(int CodCapacidadVolumetricaTanque, int Version, string CodUsuario)
        {
            string usuario = SqlTexto(CodUsuario);
            return "INSERT INTO CapacidadVolumetricaTanque_LOG "
                + "(CodCapacidadVolumetricaTanque,CodTanque,CodProducto,CodCompaniaInspeccion,FechaCalibracion,Comentarios,EsActual,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodCapacidadVolumetricaTanque,CodTanque,CodProducto,CodCompaniaInspeccion,FechaCalibracion,Comentarios,EsActual,CAST(0 AS BIT),"
                + Version + ",CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,N'"
                + usuario + "',GETDATE(),'D' "
                + "FROM CapacidadVolumetricaTanque WHERE CodCapacidadVolumetricaTanque='" + CodCapacidadVolumetricaTanque + "'; "
                + "INSERT INTO CapacidadVolumetricaTanqueDetalle_LOG "
                + "(CodCapacidadVolumetricaTanqueDetalle,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodCapacidadVolumetricaTanqueDetalle,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Dieciseisavos,Volumen,CAST(0 AS BIT),"
                + Version + ",CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,N'"
                + usuario + "',GETDATE(),'D' "
                + "FROM CapacidadVolumetricaTanqueDetalle WHERE CodCapacidadVolumetricaTanque='" + CodCapacidadVolumetricaTanque + "' AND Estatus=1; ";
        }

        private string CopiarDetallesWizardLogSql(int CodCapacidadVolumetricaTanque, string AccionLog, string CodUsuario)
        {
            string accion = SqlTexto(AccionLog);
            string usuario = SqlTexto(CodUsuario);
            bool esEliminacion = string.Equals(AccionLog, "D", StringComparison.OrdinalIgnoreCase);
            string estatus = esEliminacion ? "CAST(0 AS BIT)" : "Estatus";
            string usuarioEliminacion = esEliminacion ? "N'" + usuario + "'" : "CodUsuarioEliminacion";
            string fechaEliminacion = esEliminacion ? "GETDATE()" : "FechaEliminacion";

            return "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2_LOG', 'U') IS NOT NULL "
                + "AND OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2', 'U') IS NOT NULL "
                + "INSERT INTO CapacidadVolumetricaTanqueDetalle2_LOG "
                + "(CodCapacidadVolumetricaTanqueDetalle2,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodCapacidadVolumetricaTanqueDetalle2,CodCapacidadVolumetricaTanque,Pies,Pulgadas,Volumen,"
                + estatus + ",ISNULL(Version,1),CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,"
                + usuarioEliminacion + "," + fechaEliminacion + ",N'" + accion + "' "
                + "FROM CapacidadVolumetricaTanqueDetalle2 WHERE CodCapacidadVolumetricaTanque='" + CodCapacidadVolumetricaTanque + "' AND Estatus=1; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3_LOG', 'U') IS NOT NULL "
                + "AND OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3', 'U') IS NOT NULL "
                + "INSERT INTO CapacidadVolumetricaTanqueDetalle3_LOG "
                + "(CodCapacidadVolumetricaTanqueDetalle3,CodCapacidadVolumetricaTanque,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) "
                + "SELECT CodCapacidadVolumetricaTanqueDetalle3,CodCapacidadVolumetricaTanque,Dieciseisavos,Volumen,"
                + estatus + ",ISNULL(Version,1),CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,"
                + usuarioEliminacion + "," + fechaEliminacion + ",N'" + accion + "' "
                + "FROM CapacidadVolumetricaTanqueDetalle3 WHERE CodCapacidadVolumetricaTanque='" + CodCapacidadVolumetricaTanque + "' AND Estatus=1; ";
        }

        internal CapacidadVolumetricaTanqueAdjuntoDTO ObtenerAdjunto(int CodCapacidadVolumetricaTanque, int CodCapacidadVolumetricaTanqueAdjunto)
        {
            if (!AsegurarTablaAdjuntos().Estatus)
                return new CapacidadVolumetricaTanqueAdjuntoDTO();

            return ObjDAL
                .EjecutarReader(QueryObtenerAdjunto(CodCapacidadVolumetricaTanque, CodCapacidadVolumetricaTanqueAdjunto), MapAdjunto)
                .FirstOrDefault()
                ?? new CapacidadVolumetricaTanqueAdjuntoDTO();
        }

        internal byte[] LeerArchivoAdjunto(CapacidadVolumetricaTanqueAdjuntoDTO adjunto)
        {
            if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(adjunto.RutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        private List<CapacidadVolumetricaTanqueAdjuntoDTO> ListarAdjuntos(int CodCapacidadVolumetricaTanque)
        {
            if (!AsegurarTablaAdjuntos().Estatus)
                return new List<CapacidadVolumetricaTanqueAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(CodCapacidadVolumetricaTanque), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(CapacidadVolumetricaTanqueDTO Obj)
        {
            Obj.Adjuntos ??= new List<CapacidadVolumetricaTanqueAdjuntoDTO>();

            MsjDB tablaAdjuntos = AsegurarTablaAdjuntos();
            if (!tablaAdjuntos.Estatus)
                return tablaAdjuntos;

            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(CapacidadVolumetricaTanqueDTO Obj)
        {
            Obj.Adjuntos ??= new List<CapacidadVolumetricaTanqueAdjuntoDTO>();

            MsjDB tablaAdjuntos = AsegurarTablaAdjuntos();
            if (!tablaAdjuntos.Estatus)
                return tablaAdjuntos;

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("La capacidad volumetrica de tanque puede tener maximo " + MaxAdjuntos + " archivos.");

            List<CapacidadVolumetricaTanqueAdjuntoDTO> adjuntos = new List<CapacidadVolumetricaTanqueAdjuntoDTO>();
            foreach (CapacidadVolumetricaTanqueAdjuntoDTO adjunto in Obj.Adjuntos)
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
                    adjunto.RutaArchivo = GuardarArchivoFisico(Obj.CodCapacidadVolumetricaTanque, adjunto, contenido);
                    adjunto.ContenidoBase64 = "";
                }
                else if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                {
                    return Error("El archivo es requerido.");
                }

                adjunto.CodCapacidadVolumetricaTanque = Obj.CodCapacidadVolumetricaTanque;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private MsjDB PrepararDetallesWizard(CapacidadVolumetricaTanqueDTO Obj)
        {
            Obj.Detalles ??= new List<CapacidadVolumetricaTanqueDetalleDTO>();
            Obj.DetallesBase ??= new List<CapacidadVolumetricaTanqueDetalle2DTO>();
            Obj.DetallesFracciones ??= new List<CapacidadVolumetricaTanqueDetalle3DTO>();

            CompletarDetallesWizardDesdeDetalleFinal(Obj);

            if (Obj.DetallesBase.Count < 2)
                return Error("Debe ingresar al menos dos filas en el paso 1.");

            if (Obj.DetallesFracciones.Count == 0)
                return Error("Debe ingresar al menos un 16avo en el paso 2.");

            List<CapacidadVolumetricaTanqueDetalle2DTO> baseOrdenada = OrdenarDetallesBase(Obj.DetallesBase);
            HashSet<string> alturasBase = new HashSet<string>();
            for (int index = 0; index < baseOrdenada.Count; index++)
            {
                CapacidadVolumetricaTanqueDetalle2DTO item = baseOrdenada[index];
                item.Pies = Math.Max(0, item.Pies);
                item.Pulgadas = Math.Max(0, item.Pulgadas);

                if (item.Pulgadas > 11)
                    return Error("La altura en pulgadas del paso 1 debe estar entre 0 y 11.");

                if (item.Volumen <= 0)
                    return Error("El volumen del paso 1 debe ser mayor a cero.");

                string llave = item.Pies + "-" + item.Pulgadas;
                if (!alturasBase.Add(llave))
                    return Error("Ya existe una altura repetida en el paso 1.");

                if (index > 0 && TotalDieciseisavosBase(item) - TotalDieciseisavosBase(baseOrdenada[index - 1]) != 16)
                    return Error("La tabla base del paso 1 debe estar en pulgadas consecutivas.");
            }

            List<CapacidadVolumetricaTanqueDetalle3DTO> fraccionesOrdenadas = OrdenarDetallesFracciones(Obj.DetallesFracciones);
            HashSet<int> fracciones = new HashSet<int>();
            foreach (CapacidadVolumetricaTanqueDetalle3DTO item in fraccionesOrdenadas)
            {

                if (item.Dieciseisavos <= 0 || item.Dieciseisavos > 15)
                    return Error("Los 16avos del paso 2 deben estar entre 1 y 15.");

                if (item.Volumen <= 0)
                    return Error("El volumen del paso 2 debe ser mayor a cero.");

                if (!fracciones.Add(item.Dieciseisavos))
                    return Error("Ya existe un 16avo repetido en el paso 2.");
            }

            Obj.DetallesBase = baseOrdenada;
            Obj.DetallesFracciones = fraccionesOrdenadas;
            Obj.Detalles = CalcularDetallesFinales(baseOrdenada, fraccionesOrdenadas);
            return Ok();
        }

        private void CompletarDetallesWizardDesdeDetalleFinal(CapacidadVolumetricaTanqueDTO Obj)
        {
            Obj.Detalles ??= new List<CapacidadVolumetricaTanqueDetalleDTO>();
            Obj.DetallesBase ??= new List<CapacidadVolumetricaTanqueDetalle2DTO>();
            Obj.DetallesFracciones ??= new List<CapacidadVolumetricaTanqueDetalle3DTO>();

            if (Obj.DetallesBase.Count == 0)
            {
                Obj.DetallesBase = Obj.Detalles
                    .Where(detalle => detalle.Dieciseisavos == 0)
                    .Select(detalle => new CapacidadVolumetricaTanqueDetalle2DTO
                    {
                        CodCapacidadVolumetricaTanque = detalle.CodCapacidadVolumetricaTanque,
                        Pies = detalle.Pies,
                        Pulgadas = detalle.Pulgadas,
                        Volumen = detalle.Volumen
                    })
                    .ToList();
            }

            if (Obj.DetallesFracciones.Count == 0)
            {
                Obj.DetallesFracciones = Obj.Detalles
                    .Where(detalle => detalle.Dieciseisavos > 0 && detalle.Dieciseisavos < 16)
                    .Select(detalle => detalle.Dieciseisavos)
                    .Distinct()
                    .OrderBy(fraccion => fraccion)
                    .Select(fraccion => new CapacidadVolumetricaTanqueDetalle3DTO
                    {
                        CodCapacidadVolumetricaTanque = Obj.CodCapacidadVolumetricaTanque,
                        Dieciseisavos = fraccion,
                    })
                    .ToList();
            }
        }

        private List<CapacidadVolumetricaTanqueDetalleDTO> CalcularDetallesFinales(
            List<CapacidadVolumetricaTanqueDetalle2DTO> detallesBase,
            List<CapacidadVolumetricaTanqueDetalle3DTO> detallesFracciones)
        {
            List<CapacidadVolumetricaTanqueDetalleDTO> calculados = new List<CapacidadVolumetricaTanqueDetalleDTO>();
            List<CapacidadVolumetricaTanqueDetalle2DTO> baseOrdenada = OrdenarDetallesBase(detallesBase);
            List<CapacidadVolumetricaTanqueDetalle3DTO> fraccionesOrdenadas = OrdenarDetallesFracciones(detallesFracciones);

            foreach (CapacidadVolumetricaTanqueDetalle2DTO actual in baseOrdenada)
            {
                calculados.Add(CrearDetalleFinal(actual, 0, actual.Volumen));

                foreach (CapacidadVolumetricaTanqueDetalle3DTO fraccion in fraccionesOrdenadas)
                {
                    decimal volumen = actual.Volumen + fraccion.Volumen;
                    calculados.Add(CrearDetalleFinal(actual, fraccion.Dieciseisavos, volumen));
                }
            }

            return calculados
                .OrderBy(TotalDieciseisavos)
                .ToList();
        }

        private CapacidadVolumetricaTanqueDetalleDTO CrearDetalleFinal(CapacidadVolumetricaTanqueDetalle2DTO detalleBase, int fraccion, decimal volumen)
        {
            return new CapacidadVolumetricaTanqueDetalleDTO
            {
                CodCapacidadVolumetricaTanque = detalleBase.CodCapacidadVolumetricaTanque,
                Pies = detalleBase.Pies,
                Pulgadas = detalleBase.Pulgadas,
                Dieciseisavos = fraccion,
                Volumen = volumen
            };
        }

        private List<CapacidadVolumetricaTanqueDetalle2DTO> OrdenarDetallesBase(List<CapacidadVolumetricaTanqueDetalle2DTO> detalles)
        {
            return (detalles ?? new List<CapacidadVolumetricaTanqueDetalle2DTO>())
                .OrderBy(TotalDieciseisavosBase)
                .ToList();
        }

        private List<CapacidadVolumetricaTanqueDetalle3DTO> OrdenarDetallesFracciones(List<CapacidadVolumetricaTanqueDetalle3DTO> detalles)
        {
            return (detalles ?? new List<CapacidadVolumetricaTanqueDetalle3DTO>())
                .Where(detalle => detalle != null)
                .OrderBy(detalle => detalle.Dieciseisavos)
                .ToList();
        }

        private int TotalDieciseisavosBase(CapacidadVolumetricaTanqueDetalle2DTO detalle)
        {
            return ((detalle.Pies * 12) + detalle.Pulgadas) * 16;
        }

        private int TotalDieciseisavos(CapacidadVolumetricaTanqueDetalleDTO detalle)
        {
            return ((detalle.Pies * 12) + detalle.Pulgadas) * 16 + detalle.Dieciseisavos;
        }

        private MsjDB AsegurarTablas()
        {
            MsjDB principales = ObjDAL.Ejecutar(QueryCrearTablasPrincipales(), Key: false);
            if (!principales.Estatus)
                return Error("No fue posible crear las tablas de capacidad volumetrica de tanque.");

            MsjDB detallesWizard = AsegurarTablasDetallesWizard();
            if (!detallesWizard.Estatus)
                return detallesWizard;

            MsjDB adjuntos = AsegurarTablaAdjuntos();
            if (!adjuntos.Estatus)
                return adjuntos;

            return Ok();
        }

        private MsjDB AsegurarTablasPrincipales()
        {
            MsjDB principales = ObjDAL.Ejecutar(QueryCrearTablasPrincipales(), Key: false);
            return principales.Estatus
                ? Ok()
                : Error("No fue posible crear las tablas de capacidad volumetrica de tanque.");
        }

        private string QueryCrearTablasPrincipales()
        {
            return "IF OBJECT_ID('dbo.CapacidadVolumetricaTanque', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanque ("
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "CodTanque NVARCHAR(20) NOT NULL,"
                + "CodProducto INT NOT NULL,"
                + "CodCompaniaInspeccion INT NOT NULL,"
                + "FechaCalibracion DATETIME NOT NULL,"
                + "Comentarios NVARCHAR(1000) NULL,"
                + "EsActual BIT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanque_EsActual DEFAULT(0),"
                + "Estatus BIT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanque_Estatus DEFAULT(1),"
                + "Version INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanque_Version DEFAULT(1),"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanque_AccionLog DEFAULT('C'),"
                + "CONSTRAINT PK_CapacidadVolumetricaTanque PRIMARY KEY CLUSTERED (CodCapacidadVolumetricaTanque ASC)"
                + "); END; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanque_LOG', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanque_LOG ("
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "CodTanque NVARCHAR(20) NOT NULL,"
                + "CodProducto INT NOT NULL,"
                + "CodCompaniaInspeccion INT NOT NULL,"
                + "FechaCalibracion DATETIME NOT NULL,"
                + "Comentarios NVARCHAR(1000) NULL,"
                + "EsActual BIT NOT NULL,"
                + "Estatus BIT NOT NULL,"
                + "Version INT NOT NULL,"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL"
                + "); END; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle ("
                + "CodCapacidadVolumetricaTanqueDetalle INT NOT NULL,"
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "Pies INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle_Pies DEFAULT(0),"
                + "Pulgadas INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle_Pulgadas DEFAULT(0),"
                + "Dieciseisavos INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle_Dieciseisavos DEFAULT(0),"
                + "Volumen DECIMAL(18,4) NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle_Volumen DEFAULT(0),"
                + "Estatus BIT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle_Estatus DEFAULT(1),"
                + "Version INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle_Version DEFAULT(1),"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle_AccionLog DEFAULT('C'),"
                + "CONSTRAINT PK_CapacidadVolumetricaTanqueDetalle PRIMARY KEY CLUSTERED (CodCapacidadVolumetricaTanqueDetalle ASC)"
                + "); END; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle_LOG', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle_LOG ("
                + "CodCapacidadVolumetricaTanqueDetalle INT NOT NULL,"
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "Pies INT NOT NULL,"
                + "Pulgadas INT NOT NULL,"
                + "Dieciseisavos INT NOT NULL,"
                + "Volumen DECIMAL(18,4) NOT NULL,"
                + "Estatus BIT NOT NULL,"
                + "Version INT NOT NULL,"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL"
                + "); END; "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanque') AND name = 'IX_CapacidadVolumetricaTanque_TanqueProducto') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanque_TanqueProducto ON dbo.CapacidadVolumetricaTanque(CodTanque, CodProducto, Estatus, EsActual, FechaCalibracion); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle') AND name = 'IX_CapacidadVolumetricaTanqueDetalle_Encabezado') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanqueDetalle_Encabezado ON dbo.CapacidadVolumetricaTanqueDetalle(CodCapacidadVolumetricaTanque, Estatus); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanque_LOG') AND name = 'IX_CapacidadVolumetricaTanque_LOG_Codigo') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanque_LOG_Codigo ON dbo.CapacidadVolumetricaTanque_LOG(CodCapacidadVolumetricaTanque, Version); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle_LOG') AND name = 'IX_CapacidadVolumetricaTanqueDetalle_LOG_Encabezado') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanqueDetalle_LOG_Encabezado ON dbo.CapacidadVolumetricaTanqueDetalle_LOG(CodCapacidadVolumetricaTanque, Version);";
        }

        private MsjDB AsegurarTablasDetallesWizard()
        {
            MsjDB resultado = ObjDAL.Ejecutar(QueryCrearTablasDetallesWizard(), Key: false);
            return resultado.Estatus
                ? Ok()
                : Error("No fue posible crear las tablas del wizard de capacidad volumetrica de tanque.");
        }

        private string QueryCrearTablasDetallesWizard()
        {
            return "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle2 ("
                + "CodCapacidadVolumetricaTanqueDetalle2 INT NOT NULL,"
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "Pies INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle2_Pies DEFAULT(0),"
                + "Pulgadas INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle2_Pulgadas DEFAULT(0),"
                + "Volumen DECIMAL(18,4) NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle2_Volumen DEFAULT(0),"
                + "Estatus BIT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle2_Estatus DEFAULT(1),"
                + "Version INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle2_Version DEFAULT(1),"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle2_AccionLog DEFAULT('C'),"
                + "CONSTRAINT PK_CapacidadVolumetricaTanqueDetalle2 PRIMARY KEY CLUSTERED (CodCapacidadVolumetricaTanqueDetalle2 ASC)"
                + "); END; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2_LOG', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle2_LOG ("
                + "CodCapacidadVolumetricaTanqueDetalle2 INT NOT NULL,"
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "Pies INT NOT NULL,"
                + "Pulgadas INT NOT NULL,"
                + "Volumen DECIMAL(18,4) NOT NULL,"
                + "Estatus BIT NOT NULL,"
                + "Version INT NOT NULL,"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL"
                + "); END; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle3 ("
                + "CodCapacidadVolumetricaTanqueDetalle3 INT NOT NULL,"
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "Dieciseisavos INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle3_Dieciseisavos DEFAULT(0),"
                + "Volumen DECIMAL(18,4) NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle3_Volumen DEFAULT(0),"
                + "Estatus BIT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle3_Estatus DEFAULT(1),"
                + "Version INT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle3_Version DEFAULT(1),"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueDetalle3_AccionLog DEFAULT('C'),"
                + "CONSTRAINT PK_CapacidadVolumetricaTanqueDetalle3 PRIMARY KEY CLUSTERED (CodCapacidadVolumetricaTanqueDetalle3 ASC)"
                + "); END; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3_LOG', 'U') IS NULL "
                + "BEGIN CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle3_LOG ("
                + "CodCapacidadVolumetricaTanqueDetalle3 INT NOT NULL,"
                + "CodCapacidadVolumetricaTanque INT NOT NULL,"
                + "Dieciseisavos INT NOT NULL,"
                + "Volumen DECIMAL(18,4) NOT NULL,"
                + "Estatus BIT NOT NULL,"
                + "Version INT NOT NULL,"
                + "CodUsuarioCreacion NVARCHAR(450) NULL,"
                + "FechaCreacion DATETIME NULL,"
                + "CodUsuarioActualizacion NVARCHAR(450) NULL,"
                + "FechaActualizacion DATETIME NULL,"
                + "CodUsuarioEliminacion NVARCHAR(450) NULL,"
                + "FechaEliminacion DATETIME NULL,"
                + "AccionLog NVARCHAR(1) NOT NULL"
                + "); END; "
                + "IF COL_LENGTH('dbo.CapacidadVolumetricaTanqueDetalle3', 'Volumen') IS NULL BEGIN "
                + "CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle3_Migracion (CodCapacidadVolumetricaTanqueDetalle3 INT NOT NULL,CodCapacidadVolumetricaTanque INT NOT NULL,Dieciseisavos INT NOT NULL,Volumen DECIMAL(18,4) NOT NULL,Estatus BIT NOT NULL,Version INT NOT NULL,CodUsuarioCreacion NVARCHAR(450) NULL,FechaCreacion DATETIME NULL,CodUsuarioActualizacion NVARCHAR(450) NULL,FechaActualizacion DATETIME NULL,CodUsuarioEliminacion NVARCHAR(450) NULL,FechaEliminacion DATETIME NULL,AccionLog NVARCHAR(1) NOT NULL,CONSTRAINT PK_CapacidadVolumetricaTanqueDetalle3_Migracion PRIMARY KEY CLUSTERED (CodCapacidadVolumetricaTanqueDetalle3 ASC)); "
                + "INSERT INTO dbo.CapacidadVolumetricaTanqueDetalle3_Migracion (CodCapacidadVolumetricaTanqueDetalle3,CodCapacidadVolumetricaTanque,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) SELECT CodCapacidadVolumetricaTanqueDetalle3,CodCapacidadVolumetricaTanque,Dieciseisavos,CAST(0 AS DECIMAL(18,4)),Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog FROM dbo.CapacidadVolumetricaTanqueDetalle3; "
                + "DROP TABLE dbo.CapacidadVolumetricaTanqueDetalle3; EXEC sp_rename 'dbo.CapacidadVolumetricaTanqueDetalle3_Migracion', 'CapacidadVolumetricaTanqueDetalle3'; END; "
                + "IF COL_LENGTH('dbo.CapacidadVolumetricaTanqueDetalle3_LOG', 'Volumen') IS NULL BEGIN "
                + "CREATE TABLE dbo.CapacidadVolumetricaTanqueDetalle3_LOG_Migracion (CodCapacidadVolumetricaTanqueDetalle3 INT NOT NULL,CodCapacidadVolumetricaTanque INT NOT NULL,Dieciseisavos INT NOT NULL,Volumen DECIMAL(18,4) NOT NULL,Estatus BIT NOT NULL,Version INT NOT NULL,CodUsuarioCreacion NVARCHAR(450) NULL,FechaCreacion DATETIME NULL,CodUsuarioActualizacion NVARCHAR(450) NULL,FechaActualizacion DATETIME NULL,CodUsuarioEliminacion NVARCHAR(450) NULL,FechaEliminacion DATETIME NULL,AccionLog NVARCHAR(1) NOT NULL); "
                + "INSERT INTO dbo.CapacidadVolumetricaTanqueDetalle3_LOG_Migracion (CodCapacidadVolumetricaTanqueDetalle3,CodCapacidadVolumetricaTanque,Dieciseisavos,Volumen,Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog) SELECT CodCapacidadVolumetricaTanqueDetalle3,CodCapacidadVolumetricaTanque,Dieciseisavos,CAST(0 AS DECIMAL(18,4)),Estatus,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog FROM dbo.CapacidadVolumetricaTanqueDetalle3_LOG; "
                + "DROP TABLE dbo.CapacidadVolumetricaTanqueDetalle3_LOG; EXEC sp_rename 'dbo.CapacidadVolumetricaTanqueDetalle3_LOG_Migracion', 'CapacidadVolumetricaTanqueDetalle3_LOG'; END; "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2') AND name = 'IX_CapacidadVolumetricaTanqueDetalle2_Encabezado') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanqueDetalle2_Encabezado ON dbo.CapacidadVolumetricaTanqueDetalle2(CodCapacidadVolumetricaTanque, Estatus); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3') AND name = 'IX_CapacidadVolumetricaTanqueDetalle3_Encabezado') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanqueDetalle3_Encabezado ON dbo.CapacidadVolumetricaTanqueDetalle3(CodCapacidadVolumetricaTanque, Estatus); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle2_LOG') AND name = 'IX_CapacidadVolumetricaTanqueDetalle2_LOG_Encabezado') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanqueDetalle2_LOG_Encabezado ON dbo.CapacidadVolumetricaTanqueDetalle2_LOG(CodCapacidadVolumetricaTanque, Version); "
                + "IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueDetalle3_LOG') AND name = 'IX_CapacidadVolumetricaTanqueDetalle3_LOG_Encabezado') "
                + "CREATE INDEX IX_CapacidadVolumetricaTanqueDetalle3_LOG_Encabezado ON dbo.CapacidadVolumetricaTanqueDetalle3_LOG(CodCapacidadVolumetricaTanque, Version);";
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueAdjunto')");
        }

        private MsjDB AsegurarTablaAdjuntos()
        {
            if (ExisteTablaAdjuntos())
                return Ok();

            MsjDB resultado = ObjDAL.Ejecutar(QueryCrearTablaAdjuntos(), Key: false);
            return resultado.Estatus
                ? Ok()
                : Error("No fue posible crear la tabla de adjuntos de capacidad volumetrica de tanque.");
        }

        private string AdjuntosCantidadSql()
        {
            if (!ExisteTablaAdjuntos())
                return "0";

            return "(SELECT COUNT(1) FROM dbo.CapacidadVolumetricaTanqueAdjunto ADJ "
                + "WHERE ADJ.[CodCapacidadVolumetricaTanqueArchivo] = A.[CodCapacidadVolumetricaTanque])";
        }

        private string QueryCrearTablaAdjuntos()
        {
            return "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueAdjunto', 'U') IS NULL "
                + "BEGIN "
                + "CREATE TABLE dbo.CapacidadVolumetricaTanqueAdjunto ("
                + "CodCapacidadVolumetricaTanqueAdjunto INT IDENTITY(1,1) NOT NULL,"
                + "CodCapacidadVolumetricaTanqueArchivo INT NOT NULL,"
                + "NombreArchivo NVARCHAR(260) NOT NULL,"
                + "TipoContenido NVARCHAR(150) NOT NULL,"
                + "TamanoBytes BIGINT NOT NULL CONSTRAINT DF_CapacidadVolumetricaTanqueAdjunto_TamanoBytes DEFAULT(0),"
                + "RutaArchivo NVARCHAR(500) NOT NULL,"
                + "CONSTRAINT PK_CapacidadVolumetricaTanqueAdjunto PRIMARY KEY CLUSTERED (CodCapacidadVolumetricaTanqueAdjunto ASC)"
                + "); "
                + "END; "
                + "IF OBJECT_ID('dbo.CapacidadVolumetricaTanqueAdjunto', 'U') IS NOT NULL "
                + "AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.CapacidadVolumetricaTanqueAdjunto') AND name = 'IX_CapacidadVolumetricaTanqueAdjunto_Archivo') "
                + "BEGIN "
                + "CREATE INDEX IX_CapacidadVolumetricaTanqueAdjunto_Archivo "
                + "ON dbo.CapacidadVolumetricaTanqueAdjunto(CodCapacidadVolumetricaTanqueArchivo); "
                + "END";
        }

        private string QueryListarAdjuntos(int CodCapacidadVolumetricaTanque)
        {
            return "SELECT CodCapacidadVolumetricaTanqueAdjunto,CodCapacidadVolumetricaTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.CapacidadVolumetricaTanqueAdjunto "
                + "WHERE CodCapacidadVolumetricaTanqueArchivo='" + CodCapacidadVolumetricaTanque + "' "
                + "ORDER BY CodCapacidadVolumetricaTanqueAdjunto";
        }

        private string QueryObtenerAdjunto(int CodCapacidadVolumetricaTanque, int CodCapacidadVolumetricaTanqueAdjunto)
        {
            return "SELECT CodCapacidadVolumetricaTanqueAdjunto,CodCapacidadVolumetricaTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.CapacidadVolumetricaTanqueAdjunto "
                + "WHERE CodCapacidadVolumetricaTanqueArchivo='" + CodCapacidadVolumetricaTanque + "' "
                + "AND CodCapacidadVolumetricaTanqueAdjunto='" + CodCapacidadVolumetricaTanqueAdjunto + "'";
        }

        private string QueryGuardarAdjuntos(CapacidadVolumetricaTanqueDTO Obj)
        {
            string sql = "DELETE FROM dbo.CapacidadVolumetricaTanqueAdjunto "
                + "WHERE CodCapacidadVolumetricaTanqueArchivo='" + Obj.CodCapacidadVolumetricaTanque + "'; "
                + "DECLARE @CodCapacidadVolumetricaTanqueAdjunto INT; ";

            foreach (CapacidadVolumetricaTanqueAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.CapacidadVolumetricaTanqueAdjunto'), 'CodCapacidadVolumetricaTanqueAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.CapacidadVolumetricaTanqueAdjunto "
                    + "(CodCapacidadVolumetricaTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES('"
                    + Obj.CodCapacidadVolumetricaTanque + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodCapacidadVolumetricaTanqueAdjunto = ISNULL(MAX(CodCapacidadVolumetricaTanqueAdjunto), 0) + 1 "
                    + "FROM dbo.CapacidadVolumetricaTanqueAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.CapacidadVolumetricaTanqueAdjunto "
                    + "(CodCapacidadVolumetricaTanqueAdjunto,CodCapacidadVolumetricaTanqueArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(@CodCapacidadVolumetricaTanqueAdjunto,'"
                    + Obj.CodCapacidadVolumetricaTanque + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END ";
            }

            return sql;
        }

        private string GuardarArchivoFisico(int CodCapacidadVolumetricaTanque, CapacidadVolumetricaTanqueAdjuntoDTO adjunto, byte[] contenido)
        {
            string carpeta = CarpetaCapacidadVolumetricaTanque(CodCapacidadVolumetricaTanque);
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionPermitida(adjunto.NombreArchivo, adjunto.TipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(adjunto.NombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string nombreArchivo = "CVT" + CodCapacidadVolumetricaTanque + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "CapacidadVolumetricaTanque", "CVT" + CodCapacidadVolumetricaTanque, nombreArchivo);
        }

        private string CarpetaCapacidadVolumetricaTanque(int CodCapacidadVolumetricaTanque)
        {
            return Path.Combine(CarpetaRaizCapacidadVolumetricaTanque(), "CVT" + CodCapacidadVolumetricaTanque);
        }

        private string CarpetaRaizCapacidadVolumetricaTanque()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "CapacidadVolumetricaTanque");
        }

        private string RutaAbsolutaDesdeRelativa(string rutaRelativa)
        {
            string raiz = Path.GetFullPath(CarpetaRaizCapacidadVolumetricaTanque());
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

        private string EsActualInicialSql(CapacidadVolumetricaTanqueDTO Obj)
        {
            return "(CASE WHEN EXISTS (SELECT 1 FROM CapacidadVolumetricaTanque A "
                + "WHERE A.[CodTanque] = N'" + SqlTexto(Obj.CodTanque) + "' "
                + "AND A.[CodProducto] = '" + Obj.CodProducto + "' "
                + "AND ISNULL(A.[Estatus], 1) = 1 "
                + "AND A.[FechaCalibracion] > " + SqlFecha(Obj.FechaCalibracion) + ") THEN 0 ELSE 1 END)";
        }

        private string RecalcularActualSql(string CodTanqueExpression, string CodProductoExpression, string CodUsuario)
        {
            return "BEGIN ;WITH CapacidadOrdenada AS ("
                + "SELECT CodCapacidadVolumetricaTanque, ROW_NUMBER() OVER (ORDER BY FechaCalibracion DESC, FechaCreacion DESC, CodCapacidadVolumetricaTanque DESC) AS Orden "
                + "FROM CapacidadVolumetricaTanque "
                + "WHERE CodTanque = " + CodTanqueExpression + " AND CodProducto = " + CodProductoExpression + " AND ISNULL(Estatus, 1) = 1"
                + "), CapacidadCalculada AS ("
                + "SELECT C.CodCapacidadVolumetricaTanque, CAST(CASE WHEN O.Orden = 1 THEN 1 ELSE 0 END AS BIT) AS EsActualCalculado "
                + "FROM CapacidadVolumetricaTanque C "
                + "LEFT JOIN CapacidadOrdenada O ON C.CodCapacidadVolumetricaTanque = O.CodCapacidadVolumetricaTanque "
                + "WHERE C.CodTanque = " + CodTanqueExpression + " AND C.CodProducto = " + CodProductoExpression
                + ") "
                + "UPDATE C SET EsActual=A.EsActualCalculado, Version=ISNULL(C.Version,0)+1, CodUsuarioActualizacion='" + SqlTexto(CodUsuario) + "', FechaActualizacion=GETDATE() "
                + "FROM CapacidadVolumetricaTanque C INNER JOIN CapacidadCalculada A ON C.CodCapacidadVolumetricaTanque = A.CodCapacidadVolumetricaTanque "
                + "WHERE ISNULL(C.EsActual, 0) <> A.EsActualCalculado; END; ";
        }

        private CapacidadVolumetricaTanqueDTO MapCapacidadVolumetricaTanque(SqlDataReader reader)
        {
            CapacidadVolumetricaTanqueDTO Obj = new CapacidadVolumetricaTanqueDTO();
            Obj.CodCapacidadVolumetricaTanque = Convert.ToInt32(reader["CodCapacidadVolumetricaTanque"]);
            Obj.IdCapacidadVolumetricaTanque = ObjEncriptacion.Encriptar(Obj.CodCapacidadVolumetricaTanque.ToString());
            Obj.CodTanque = reader["CodTanque"].ToString() ?? "";
            Obj.IdTanque = ObjEncriptacion.Encriptar(Obj.CodTanque);
            Obj.Tanque = reader["Tanque"].ToString() ?? "";
            Obj.CodProducto = Convert.ToInt32(reader["CodProducto"]);
            Obj.IdProducto = ObjEncriptacion.Encriptar(Obj.CodProducto.ToString());
            Obj.Producto = reader["Producto"].ToString() ?? "";
            Obj.CodCompaniaInspeccion = Int(reader["CodCompaniaInspeccion"]);
            if (Obj.CodCompaniaInspeccion > 0)
                Obj.IdCompaniaInspeccion = ObjEncriptacion.Encriptar(Obj.CodCompaniaInspeccion.ToString());
            Obj.CompaniaInspeccion = reader["CompaniaInspeccion"].ToString() ?? "";
            Obj.FechaCalibracion = Fecha(reader["FechaCalibracion"]);
            Obj.Comentarios = reader["Comentarios"].ToString() ?? "";
            Obj.EsActual = Bool(reader["EsActual"]);
            Obj.DetalleCantidad = Convert.ToInt32(reader["DetalleCantidad"]);
            Obj.AdjuntoCantidad = Int(reader["AdjuntoCantidad"]);
            Obj.Estatus = Bool(reader["Estatus"]);
            return Obj;
        }

        private CapacidadVolumetricaTanqueAdjuntoDTO MapAdjunto(SqlDataReader reader)
        {
            CapacidadVolumetricaTanqueAdjuntoDTO adjunto = new CapacidadVolumetricaTanqueAdjuntoDTO
            {
                CodCapacidadVolumetricaTanqueAdjunto = Int(reader["CodCapacidadVolumetricaTanqueAdjunto"]),
                CodCapacidadVolumetricaTanque = Int(reader["CodCapacidadVolumetricaTanqueArchivo"]),
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoContenido(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = Long(reader["TamanoBytes"]),
                RutaArchivo = reader["RutaArchivo"].ToString() ?? ""
            };

            return adjunto;
        }

        private CapacidadVolumetricaTanqueDTO MapCapacidadVolumetricaTanqueLog(SqlDataReader reader)
        {
            CapacidadVolumetricaTanqueDTO Obj = MapCapacidadVolumetricaTanque(reader);
            Obj.Version = Convert.ToInt32(reader["Version"]);
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (Obj.CodUsuarioCreacion != "")
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion.ToString());

            Obj.FechaCreacion = Fecha(reader["FechaCreacion"]);

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (Obj.CodUsuarioActualizacion != "")
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion.ToString());

            Obj.FechaActualizacion = Fecha(reader["FechaActualizacion"]);
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);

            return Obj;
        }

        private DateTime? Fecha(object valor)
        {
            if (valor != DBNull.Value && DateTime.TryParse(valor.ToString(), out DateTime fecha))
                return fecha;

            return null;
        }

        private bool Bool(object valor)
        {
            if (valor == DBNull.Value)
                return false;

            return Convert.ToBoolean(valor);
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

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string SqlTextoLiteral(string? valor)
        {
            return "N'" + SqlTexto((valor ?? "").Trim()) + "'";
        }

        private string SqlFecha(DateTime? valor)
        {
            if (!valor.HasValue)
                return "NULL";

            return "'" + valor.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture) + "'";
        }

        private string SqlNumero(decimal valor)
        {
            return valor.ToString(CultureInfo.InvariantCulture);
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
