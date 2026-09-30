using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Globalization;
using System.IO;

namespace app.Models.Notificacion
{
    /// <summary>Acceso a datos del modulo Notificacion.</summary>
    internal class NotificacionDAO
    {
        private const int MaxAdjuntos = app.ArchivoPermitido.MaxAdjuntos;
        private const int MaxAdjuntoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<NotificacionDTO> Listado(
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "",
            int codTarea = 0)
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<NotificacionDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, codTarea), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapNotificacion(reader);
            });

            return new PaginacionResultado<NotificacionDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar()
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Listar), reader => new SelectListItem()
            {
                Text = reader["Descripcion"].ToString(),
                Value = reader["CodNotificacion"].ToString()
            });
        }

        internal NotificacionDTO Obtener(int CodNotificacion)
        {
            NotificacionDTO notificacion = ObjDAL
                .EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodNotificacion), MapNotificacion)
                .FirstOrDefault()
                ?? new NotificacionDTO();

            if (notificacion.CodNotificacion > 0)
            {
                notificacion.Adjuntos = ListarAdjuntos(notificacion.CodNotificacion);
                notificacion.AdjuntoCantidad = notificacion.Adjuntos.Count;
            }

            return notificacion;
        }

        internal MsjDB Agregar(NotificacionDTO Obj)
        {
            Obj.Version = 1;
            Obj.Estado = 0;
            Obj.Intentos = 0;
            Obj.Estatus = true;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararNotificacion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: true, tipoDAL: TipoDAL.Agregar);
            if (msjDB.Estatus == true)
            {
                Obj.CodNotificacion = msjDB.Key;
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("Notificacion", "CREADO", "CodNotificacion:" + Obj.CodNotificacion, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Editar(NotificacionDTO Obj)
        {
            NotificacionDTO ObjAnterior = Obtener(Obj.CodNotificacion);
            if (ObjAnterior.CodNotificacion <= 0)
                return Error("Notificacion no encontrada.");

            Obj.Estado = ObjAnterior.Estado;
            Obj.Intentos = ObjAnterior.Intentos;
            Obj.Error = ObjAnterior.Error;
            Obj.FechaEnviado = ObjAnterior.FechaEnviado;
            Obj.Version = ObtenerVersion(Obj.CodNotificacion);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacion = PrepararNotificacion(Obj);
            if (!validacion.Estatus)
                return validacion;

            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);
            if (msjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("Notificacion", "EDITADO", "CodNotificacion:" + Obj.CodNotificacion, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return msjDB;
        }

        internal MsjDB Eliminar(int CodNotificacion)
        {
            NotificacionDTO ObjAnterior = Obtener(CodNotificacion);
            if (ObjAnterior.CodNotificacion <= 0)
                return Error("Notificacion no encontrada.");

            NotificacionDTO Obj = new NotificacionDTO
            {
                CodNotificacion = CodNotificacion,
                Version = ObtenerVersion(CodNotificacion),
                CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario()
            };
            MsjDB msjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);
            if (msjDB.Estatus == true)
                LogModificacionDAO.Registrar("Notificacion", "ELIMINADO", "CodNotificacion:" + CodNotificacion, Anterior: ObjAnterior);

            return msjDB;
        }

        internal MsjDB Programar(int CodNotificacion, DateTime? FechaProgramada)
        {
            if (FechaProgramada.HasValue && FechaProgramada.Value < DateTime.Now.AddMinutes(-1))
                return Error("La fecha programada no puede ser anterior a la fecha actual.");

            return PrepararEnvio(CodNotificacion, FechaProgramada, reiniciarIntentos: false);
        }

        internal MsjDB EnviarAhora(int CodNotificacion)
        {
            return PrepararEnvio(CodNotificacion, null, reiniciarIntentos: false);
        }

        internal MsjDB Reintentar(int CodNotificacion)
        {
            return PrepararEnvio(CodNotificacion, null, reiniciarIntentos: true);
        }

        internal MsjDB Cancelar(int CodNotificacion)
        {
            NotificacionDTO ObjAnterior = Obtener(CodNotificacion);
            if (ObjAnterior.CodNotificacion <= 0)
                return Error("Notificacion no encontrada.");

            NotificacionDTO Obj = new NotificacionDTO
            {
                CodNotificacion = CodNotificacion,
                Estado = 4,
                Version = ObtenerVersion(CodNotificacion),
                CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario()
            };

            MsjDB msjDB = ObjDAL.Ejecutar(QueryCancelar(Obj), Key: false);
            if (msjDB.Estatus == true)
                LogModificacionDAO.Registrar("Notificacion", "Cancelar", "CodNotificacion:" + CodNotificacion, Anterior: ObjAnterior, Nuevo: Obj);

            return msjDB;
        }

        internal int ObtenerVersion(int CodNotificacion)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodNotificacion), 1);
        }

        internal List<NotificacionDTO> Log(int CodNotificacion)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodNotificacion), MapNotificacionLog);
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, NotificacionDTO? Obj = null)
        {
            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "DECLARE @CodNotificacion INT; "
                        + "IF COLUMNPROPERTY(OBJECT_ID('dbo.Notificacion'), 'CodNotificacion', 'IsIdentity') = 1 "
                        + "BEGIN "
                        + "INSERT INTO Notificacion "
                        + "(CodTarea,Descripcion,Asunto,[Para],Copia,Texto,FechaProgramada,Estado,Intentos,Error,FechaEnviado,FechaCreacion,Estatus,Version,CodUsuarioCreacion) "
                        + "VALUES("
                        + SqlNullableInt(Obj!.CodTarea) + ",N'"
                        + SqlTexto(Obj.Descripcion) + "',N'"
                        + SqlTexto(Obj.Asunto) + "',N'"
                        + SqlTexto(Obj.Para) + "',N'"
                        + SqlTexto(Obj.Copia) + "',N'"
                        + SqlTexto(Obj.Texto) + "',"
                        + SqlFecha(Obj.FechaProgramada) + ","
                        + Obj.Estado + ","
                        + Obj.Intentos + ",NULL,NULL,GETDATE(),"
                        + SqlBit(Obj.Estatus) + ","
                        + Obj.Version + ",N'"
                        + SqlTexto(Obj.CodUsuarioCreacion) + "'); "
                        + "SET @CodNotificacion = CAST(SCOPE_IDENTITY() AS INT); "
                        + "END "
                        + "ELSE "
                        + "BEGIN "
                        + "SELECT @CodNotificacion = ISNULL(MAX(CodNotificacion), 0) + 1 FROM Notificacion WITH (UPDLOCK, HOLDLOCK); "
                        + "INSERT INTO Notificacion "
                        + "(CodNotificacion,CodTarea,Descripcion,Asunto,[Para],Copia,Texto,FechaProgramada,Estado,Intentos,Error,FechaEnviado,FechaCreacion,Estatus,Version,CodUsuarioCreacion) "
                        + "VALUES(@CodNotificacion,"
                        + SqlNullableInt(Obj.CodTarea) + ",N'"
                        + SqlTexto(Obj.Descripcion) + "',N'"
                        + SqlTexto(Obj.Asunto) + "',N'"
                        + SqlTexto(Obj.Para) + "',N'"
                        + SqlTexto(Obj.Copia) + "',N'"
                        + SqlTexto(Obj.Texto) + "',"
                        + SqlFecha(Obj.FechaProgramada) + ","
                        + Obj.Estado + ","
                        + Obj.Intentos + ",NULL,NULL,GETDATE(),"
                        + SqlBit(Obj.Estatus) + ","
                        + Obj.Version + ",N'"
                        + SqlTexto(Obj.CodUsuarioCreacion) + "'); "
                        + "END "
                        + "SELECT @CodNotificacion;";
                case TipoDAL.Editar:
                    return "UPDATE Notificacion SET "
                        + "CodTarea=" + SqlNullableInt(Obj!.CodTarea) + ","
                        + "Descripcion=N'" + SqlTexto(Obj.Descripcion) + "',"
                        + "Asunto=N'" + SqlTexto(Obj.Asunto) + "',"
                        + "[Para]=N'" + SqlTexto(Obj.Para) + "',"
                        + "Copia=N'" + SqlTexto(Obj.Copia) + "',"
                        + "Texto=N'" + SqlTexto(Obj.Texto) + "',"
                        + "FechaProgramada=" + SqlFecha(Obj.FechaProgramada) + ","
                        + "Estatus=" + SqlBit(Obj.Estatus) + ","
                        + "Version=" + Obj.Version + ","
                        + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                        + "FechaActualizacion=GETDATE() "
                        + "WHERE CodNotificacion='" + Obj.CodNotificacion + "'";
                case TipoDAL.Eliminar:
                    return "UPDATE Notificacion SET "
                        + "Estatus=0,Estado=4,Version=" + Obj!.Version + ","
                        + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                        + "FechaActualizacion=GETDATE() "
                        + "WHERE CodNotificacion='" + Obj.CodNotificacion + "'; "
                        + "IF OBJECT_ID('dbo.NotificacionAdjunto', 'U') IS NOT NULL "
                        + "DELETE FROM dbo.NotificacionAdjunto "
                        + "WHERE CodNotificacion='" + Obj.CodNotificacion + "';";
                case TipoDAL.Listar:
                    return "SELECT A.[CodNotificacion],A.[Descripcion] FROM Notificacion A WHERE A.[Estatus] = 1 ORDER BY A.[Descripcion]";
                case TipoDAL.Obtener:
                    return "SELECT " + Columnas("A", "B") + " FROM Notificacion A "
                        + "LEFT JOIN Tarea B ON A.CodTarea = B.CodTarea "
                        + "WHERE A.[CodNotificacion]='" + CodKey + "'";
                case TipoDAL.Version:
                    return "IF OBJECT_ID('dbo.Notificacion_LOG', 'U') IS NOT NULL "
                        + "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM Notificacion_LOG UNION ALL SELECT * FROM Notificacion) A "
                        + "WHERE A.[CodNotificacion]='" + CodKey + "' "
                        + "ELSE SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM Notificacion A "
                        + "WHERE A.[CodNotificacion]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "IF OBJECT_ID('dbo.Notificacion_LOG', 'U') IS NOT NULL "
                        + SelectLog("(SELECT * FROM Notificacion_LOG UNION ALL SELECT * FROM Notificacion)", CodKey)
                        + "ELSE "
                        + SelectLog("Notificacion", CodKey);
                default:
                    return "";
            }
        }

        private MsjDB PrepararEnvio(int CodNotificacion, DateTime? fechaProgramada, bool reiniciarIntentos)
        {
            NotificacionDTO ObjAnterior = Obtener(CodNotificacion);
            if (ObjAnterior.CodNotificacion <= 0)
                return Error("Notificacion no encontrada.");

            if (!ValidarListaCorreos(ObjAnterior.Para))
                return Error("La notificacion debe tener al menos un destinatario valido.");

            if (!HtmlPolicyValidator.EsValido(ObjAnterior.Texto, out string mensajeHtml))
                return Error(mensajeHtml);

            NotificacionDTO Obj = new NotificacionDTO
            {
                CodNotificacion = CodNotificacion,
                FechaProgramada = fechaProgramada,
                Estado = 0,
                Intentos = reiniciarIntentos ? 0 : ObjAnterior.Intentos,
                Version = ObtenerVersion(CodNotificacion),
                CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario()
            };

            MsjDB msjDB = ObjDAL.Ejecutar(QueryPrepararEnvio(Obj, reiniciarIntentos), Key: false);
            if (msjDB.Estatus == true)
                LogModificacionDAO.Registrar("Notificacion", reiniciarIntentos ? "Reintentar" : "Programar", "CodNotificacion:" + CodNotificacion, Anterior: ObjAnterior, Nuevo: Obj);

            return msjDB;
        }

        private MsjDB PrepararNotificacion(NotificacionDTO Obj)
        {
            Obj.Descripcion = (Obj.Descripcion ?? "").Trim();
            Obj.Asunto = (Obj.Asunto ?? "").Trim();
            Obj.Para = (Obj.Para ?? "").Trim();
            Obj.Copia = (Obj.Copia ?? "").Trim();
            Obj.Texto = (Obj.Texto ?? "").Trim();

            if (string.IsNullOrWhiteSpace(Obj.Descripcion))
                return Error("La descripcion de la notificacion es requerida.");

            if (Obj.Descripcion.Length > 250)
                return Error("La descripcion de la notificacion debe tener maximo 250 caracteres.");

            if (Obj.Asunto.Length > 500)
                return Error("El asunto debe tener maximo 500 caracteres.");

            if (!HtmlPolicyValidator.EsValido(Obj.Texto, out string mensajeHtml))
                return Error(mensajeHtml);

            Obj.CodTarea = Obj.CodTarea.HasValue && Obj.CodTarea.Value > 0
                ? Obj.CodTarea.Value
                : null;

            if (Obj.CodTarea.HasValue && !ExisteTarea(Obj.CodTarea.Value))
                return Error("La tarea seleccionada no existe o esta inactiva.");

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            return Ok();
        }

        private bool ExisteTarea(int codTarea)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM Tarea WHERE CodTarea='" + codTarea + "' AND Estatus=1");
        }

        private List<NotificacionAdjuntoDTO> ListarAdjuntos(int codNotificacion)
        {
            if (!ExisteTablaAdjuntos())
                return new List<NotificacionAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(codNotificacion), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(NotificacionDTO Obj)
        {
            if (!ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de notificaciones no existe. Ejecute el script de tareas y notificaciones.");

            Obj.Adjuntos ??= new List<NotificacionAdjuntoDTO>();
            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(NotificacionDTO Obj)
        {
            Obj.Adjuntos ??= new List<NotificacionAdjuntoDTO>();

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("La notificacion puede tener maximo " + MaxAdjuntos + " adjuntos.");

            List<NotificacionAdjuntoDTO> adjuntos = new List<NotificacionAdjuntoDTO>();
            foreach (NotificacionAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                if (adjunto == null)
                    continue;

                adjunto.NombreArchivo = Path.GetFileName((adjunto.NombreArchivo ?? "").Trim());
                adjunto.TipoContenido = NormalizarTipoContenido(adjunto.TipoContenido, adjunto.NombreArchivo);
                adjunto.ContenidoBase64 = NormalizarContenidoBase64(adjunto.ContenidoBase64);

                bool vacio = string.IsNullOrWhiteSpace(adjunto.NombreArchivo)
                    && string.IsNullOrWhiteSpace(adjunto.ContenidoBase64);
                if (vacio)
                    continue;

                if (string.IsNullOrWhiteSpace(adjunto.NombreArchivo))
                    return Error("El nombre del archivo adjunto es requerido.");

                if (adjunto.NombreArchivo.Length > 260)
                    return Error("El nombre del archivo adjunto debe tener maximo 260 caracteres.");

                if (adjunto.TipoContenido.Length > 150)
                    return Error("El tipo de contenido del adjunto debe tener maximo 150 caracteres.");

                if (string.IsNullOrWhiteSpace(adjunto.ContenidoBase64))
                    return Error("El contenido del archivo adjunto es requerido.");

                if (!app.ArchivoPermitido.MetadataAdjuntoPermitida(adjunto.NombreArchivo, adjunto.TipoContenido))
                    return Error("Solo se permiten archivos .pdf, .jpg, .jpeg o .png.");

                byte[] contenido;
                try
                {
                    contenido = Convert.FromBase64String(adjunto.ContenidoBase64);
                }
                catch (FormatException)
                {
                    return Error("El contenido del archivo adjunto no tiene un formato valido.");
                }

                if (contenido.LongLength > MaxAdjuntoBytes)
                    return Error("Cada archivo adjunto debe pesar maximo 10 MB.");

                if (!app.ArchivoPermitido.FirmaContenidoValida(adjunto.TipoContenido, contenido))
                    return Error("El archivo adjunto no coincide con el tipo permitido.");

                adjunto.CodNotificacion = Obj.CodNotificacion;
                adjunto.TamanoBytes = contenido.LongLength;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.NotificacionAdjunto')");
        }

        private string QueryListarAdjuntos(int codNotificacion)
        {
            return "SELECT CodNotificacionAdjunto,CodNotificacion,NombreArchivo,TipoContenido,TamanoBytes,ContenidoBase64 "
                + "FROM dbo.NotificacionAdjunto "
                + "WHERE CodNotificacion='" + codNotificacion + "' "
                + "ORDER BY CodNotificacionAdjunto";
        }

        private string QueryGuardarAdjuntos(NotificacionDTO Obj)
        {
            string sql = "DELETE FROM dbo.NotificacionAdjunto "
                + "WHERE CodNotificacion='" + Obj.CodNotificacion + "'; "
                + "DECLARE @CodNotificacionAdjunto INT; ";

            foreach (NotificacionAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.NotificacionAdjunto'), 'CodNotificacionAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.NotificacionAdjunto "
                    + "(CodNotificacion,NombreArchivo,TipoContenido,TamanoBytes,ContenidoBase64) "
                    + "VALUES('"
                    + Obj.CodNotificacion + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.ContenidoBase64) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodNotificacionAdjunto = ISNULL(MAX(CodNotificacionAdjunto), 0) + 1 "
                    + "FROM dbo.NotificacionAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.NotificacionAdjunto "
                    + "(CodNotificacionAdjunto,CodNotificacion,NombreArchivo,TipoContenido,TamanoBytes,ContenidoBase64) "
                    + "VALUES(@CodNotificacionAdjunto,'"
                    + Obj.CodNotificacion + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.ContenidoBase64) + "'); "
                    + "END ";
            }

            return sql;
        }

        private string QueryPrepararEnvio(NotificacionDTO Obj, bool reiniciarIntentos)
        {
            return "UPDATE Notificacion SET "
                + "Estado=0,"
                + (reiniciarIntentos ? "Intentos=0," : "")
                + "FechaProgramada=" + SqlFecha(Obj.FechaProgramada) + ","
                + "Error=NULL,"
                + "FechaEnviado=NULL,"
                + "Version=" + Obj.Version + ","
                + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                + "FechaActualizacion=GETDATE() "
                + "WHERE CodNotificacion='" + Obj.CodNotificacion + "'";
        }

        private string QueryCancelar(NotificacionDTO Obj)
        {
            return "UPDATE Notificacion SET "
                + "Estado=4,"
                + "Version=" + Obj.Version + ","
                + "CodUsuarioActualizacion=N'" + SqlTexto(Obj.CodUsuarioActualizacion) + "',"
                + "FechaActualizacion=GETDATE() "
                + "WHERE CodNotificacion='" + Obj.CodNotificacion + "'";
        }

        private string QueryListado(PaginacionParametros paginacion, int codTarea)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codNotificacion"] = "A.[CodNotificacion]",
                ["codTarea"] = "A.[CodTarea]",
                ["descripcion"] = "A.[Descripcion]",
                ["asunto"] = "A.[Asunto]",
                ["fechaProgramada"] = "A.[FechaProgramada]",
                ["estado"] = "A.[Estado]",
                ["intentos"] = "A.[Intentos]",
                ["fechaEnviado"] = "A.[FechaEnviado]",
                ["fechaCreacion"] = "A.[FechaCreacion]"
            };
            string where = "WHERE A.[Estatus] = 1 "
                + (codTarea > 0 ? "AND A.[CodTarea] = '" + codTarea + "' " : "")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodNotificacion])",
                    "CONVERT(VARCHAR(20), A.[CodTarea])",
                    "A.[Descripcion]",
                    "A.[Asunto]",
                    "A.[Para]",
                    "A.[Copia]",
                    "B.[Descripcion]",
                    "A.[Error]"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodNotificacion] ASC");

            return "SELECT " + Columnas("A", "B") + ", "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM Notificacion A "
                + "LEFT JOIN Tarea B ON A.CodTarea = B.CodTarea "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string SelectLog(string tableName, int codNotificacion)
        {
            return "SELECT " + Columnas("A", "B") + ","
                + "A.[Version],A.[CodUsuarioCreacion],"
                + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog],A.[Estatus] "
                + "FROM " + tableName + " A "
                + "LEFT JOIN Tarea B ON A.CodTarea = B.CodTarea "
                + "WHERE A.[CodNotificacion] = '" + codNotificacion + "' "
                + "ORDER BY A.Version ";
        }

        private string Columnas(string alias, string tareaAlias)
        {
            return alias + ".[CodNotificacion],"
                + alias + ".[CodTarea],"
                + "ISNULL(" + tareaAlias + ".[Descripcion], '') AS [TareaDescripcion],"
                + alias + ".[Descripcion],"
                + alias + ".[Asunto],"
                + alias + ".[Para],"
                + alias + ".[Copia],"
                + alias + ".[Texto],"
                + alias + ".[FechaProgramada],"
                + alias + ".[Estado],"
                + alias + ".[Intentos],"
                + alias + ".[Error],"
                + alias + ".[FechaEnviado],"
                + alias + ".[FechaCreacion],"
                + alias + ".[Estatus]";
        }

        private NotificacionDTO MapNotificacion(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            NotificacionDTO Obj = new NotificacionDTO();
            Obj.CodNotificacion = Convert.ToInt32(reader["CodNotificacion"]);
            Obj.IdNotificacion = ObjEncriptacion.Encriptar(Obj.CodNotificacion.ToString());
            Obj.CodTarea = reader["CodTarea"] == DBNull.Value ? null : Convert.ToInt32(reader["CodTarea"]);

            if (Obj.CodTarea.HasValue)
                Obj.IdTarea = ObjEncriptacion.Encriptar(Obj.CodTarea.Value.ToString());

            Obj.TareaDescripcion = reader["TareaDescripcion"].ToString() ?? "";
            Obj.Descripcion = reader["Descripcion"].ToString() ?? "";
            Obj.Asunto = reader["Asunto"].ToString() ?? "";
            Obj.Para = reader["Para"].ToString() ?? "";
            Obj.Copia = reader["Copia"].ToString() ?? "";
            Obj.Texto = reader["Texto"].ToString() ?? "";
            Obj.FechaProgramada = LeerFecha(reader, "FechaProgramada");
            Obj.Estado = LeerEntero(reader, "Estado");
            Obj.EstadoDescripcion = EstadoDescripcion(Obj.Estado);
            Obj.Intentos = LeerEntero(reader, "Intentos");
            Obj.Error = reader["Error"].ToString() ?? "";
            Obj.FechaEnviado = LeerFecha(reader, "FechaEnviado");
            Obj.FechaCreacion = LeerFecha(reader, "FechaCreacion");
            Obj.Estatus = reader["Estatus"] == DBNull.Value || Convert.ToBoolean(reader["Estatus"]);
            return Obj;
        }

        private NotificacionDTO MapNotificacionLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            NotificacionDTO Obj = MapNotificacion(reader);
            Obj.Version = LeerEntero(reader, "Version");
            Obj.CodUsuarioCreacion = reader["CodUsuarioCreacion"].ToString();

            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioCreacion))
                Obj.IdUsuarioCreacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioCreacion);

            Obj.CodUsuarioActualizacion = reader["CodUsuarioActualizacion"].ToString();

            if (!string.IsNullOrWhiteSpace(Obj.CodUsuarioActualizacion))
                Obj.IdUsuarioActualizacion = ObjEncriptacion.Encriptar(Obj.CodUsuarioActualizacion);

            Obj.FechaActualizacion = LeerFecha(reader, "FechaActualizacion");
            ControlCambioMapper.Mapear(Obj, reader, ObjEncriptacion);
            return Obj;
        }

        private NotificacionAdjuntoDTO MapAdjunto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            NotificacionAdjuntoDTO adjunto = new NotificacionAdjuntoDTO
            {
                CodNotificacionAdjunto = LeerEntero(reader, "CodNotificacionAdjunto"),
                CodNotificacion = LeerEntero(reader, "CodNotificacion"),
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoContenido(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = LeerLong(reader, "TamanoBytes"),
                ContenidoBase64 = reader["ContenidoBase64"].ToString() ?? ""
            };

            return adjunto;
        }

        private bool ValidarListaCorreos(string correos)
        {
            return (correos ?? "")
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Any(correo => correo.Contains('@') && correo.Contains('.'));
        }

        private string EstadoDescripcion(int estado)
        {
            return estado switch
            {
                1 => "Procesando",
                2 => "Enviado",
                3 => "Error",
                4 => "Cancelado",
                _ => "Pendiente"
            };
        }

        private int LeerEntero(Microsoft.Data.SqlClient.SqlDataReader reader, string columna)
        {
            return reader[columna] == DBNull.Value ? 0 : Convert.ToInt32(reader[columna]);
        }

        private DateTime? LeerFecha(Microsoft.Data.SqlClient.SqlDataReader reader, string columna)
        {
            return reader[columna] == DBNull.Value ? null : Convert.ToDateTime(reader[columna]);
        }

        private long LeerLong(Microsoft.Data.SqlClient.SqlDataReader reader, string columna)
        {
            return reader[columna] == DBNull.Value ? 0 : Convert.ToInt64(reader[columna]);
        }

        private MsjDB Ok()
        {
            return new MsjDB { Estatus = true, Msj = "", Key = 0 };
        }

        private MsjDB Error(string mensaje)
        {
            return new MsjDB { Estatus = false, Msj = mensaje, Key = 0 };
        }

        private string SqlTexto(string? valor)
        {
            return (valor ?? "").Replace("'", "''");
        }

        private string SqlBit(bool valor)
        {
            return valor ? "1" : "0";
        }

        private string SqlNullableInt(int? valor)
        {
            return valor.HasValue && valor.Value > 0 ? "'" + valor.Value + "'" : "NULL";
        }

        private string SqlFecha(DateTime? valor)
        {
            return valor.HasValue
                ? "'" + valor.Value.ToString("yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture) + "'"
                : "NULL";
        }

        private string NormalizarTipoContenido(string? tipoContenido, string nombreArchivo)
        {
            return app.ArchivoPermitido.NormalizarTipoContenido(tipoContenido, nombreArchivo, permitirPdf: true);
        }

        private string NormalizarContenidoBase64(string? contenido)
        {
            return app.ArchivoPermitido.NormalizarContenidoBase64(contenido);
        }
    }
}





