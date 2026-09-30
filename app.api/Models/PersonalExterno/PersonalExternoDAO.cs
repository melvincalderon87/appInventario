using app.Messages;
using app.Models.LogModificaciones;
using app.Models.Paginacion;
using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace app.Models.PersonalExterno
{
    /// <summary>Acceso a datos del modulo PersonalExterno.</summary>
    internal class PersonalExternoDAO
    {
        private const int MaxFotoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private const int MaxAdjuntos = app.ArchivoPermitido.MaxAdjuntos;
        private const int MaxAdjuntoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private static readonly HashSet<string> TiposFotoPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png"
        };
        private static readonly HashSet<string> TiposAdjuntosPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf",
            "image/jpeg",
            "image/png"
        };

        private readonly DAL ObjDAL = new DAL();
        private MsjDB MsjDB = new MsjDB();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal PaginacionResultado<PersonalExternoDTO> Listado(
            int page = 1,
            int pageSize = 50,
            string search = "",
            string sort = "",
            int CodCompaniaInspeccion = 0)
        {
            PaginacionParametros paginacion = PaginacionParametros.Crear(page, pageSize, search, sort);
            int totalCount = 0;
            List<PersonalExternoDTO> items = ObjDAL.EjecutarReader(QueryListado(paginacion, CodCompaniaInspeccion), reader =>
            {
                if (totalCount == 0)
                    totalCount = PaginacionSql.LeerTotal(reader);

                return MapPersonalExterno(reader);
            });

            return new PaginacionResultado<PersonalExternoDTO>(items, totalCount, paginacion.Page, paginacion.PageSize);
        }

        internal List<SelectListItem> Listar(int CodCompaniaInspeccion = 0)
        {
            return ObjDAL.EjecutarReader(QueryListar(CodCompaniaInspeccion), reader => new SelectListItem()
            {
                Text = reader["Nombre"].ToString(),
                Value = reader["CodPersonalExterno"].ToString()
            });
        }

        internal PersonalExternoDTO Obtener(int CodPersonalExterno)
        {
            PersonalExternoDTO personalExterno = ObjDAL
                .EjecutarReader(Query(TipoDAL.Obtener, CodKey: CodPersonalExterno), MapPersonalExterno)
                .FirstOrDefault()
                ?? new PersonalExternoDTO();

            if (personalExterno.CodPersonalExterno > 0)
            {
                personalExterno.Adjuntos = ListarAdjuntos(personalExterno.CodPersonalExterno);
                personalExterno.AdjuntoCantidad = personalExterno.Adjuntos.Count;
            }

            return personalExterno;
        }

        internal int ObtenerKey()
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.ObtenerKey), 1);
        }

        internal MsjDB Agregar(PersonalExternoDTO Obj)
        {
            MsjDB validacion = Validar(Obj);
            if (!validacion.Estatus)
                return validacion;

            Obj.CodPersonalExterno = ObtenerKey();
            Obj.Version = 1;
            Obj.CodUsuarioCreacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionFoto = PrepararFoto(Obj);
            if (!validacionFoto.Estatus)
                return validacionFoto;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Agregar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Agregar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                MsjDB.Key = Obj.CodPersonalExterno;
                LogModificacionDAO.Registrar("PersonalExterno", "CREADO", "CodPersonalExterno:" + Obj.CodPersonalExterno, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Editar(PersonalExternoDTO Obj)
        {
            MsjDB validacion = Validar(Obj);
            if (!validacion.Estatus)
                return validacion;

            PersonalExternoDTO ObjAnterior = Obtener(Obj.CodPersonalExterno);
            Obj.Version = ObtenerVersion(Obj.CodPersonalExterno);
            Obj.CodUsuarioActualizacion = new VerificarUsuario().SesionUsuario();

            MsjDB validacionFoto = PrepararFoto(Obj);
            if (!validacionFoto.Estatus)
                return validacionFoto;

            MsjDB validacionAdjuntos = PrepararAdjuntos(Obj);
            if (!validacionAdjuntos.Estatus)
                return validacionAdjuntos;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Editar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Editar);

            if (MsjDB.Estatus == true)
            {
                MsjDB adjuntos = GuardarAdjuntos(Obj);
                if (!adjuntos.Estatus)
                    return adjuntos;

                LogModificacionDAO.Registrar("PersonalExterno", "EDITADO", "CodPersonalExterno:" + Obj.CodPersonalExterno, Anterior: ObjAnterior, Nuevo: Obj);
            }

            return MsjDB;
        }

        internal MsjDB Eliminar(PersonalExternoDTO Obj)
        {
            PersonalExternoDTO ObjAnterior = Obtener(Obj.CodPersonalExterno);
            MsjDB ValidacionRelacion = new DatoMaestroRelacion().ValidarEliminacion("PersonalExterno", "CodPersonalExterno", Obj.CodPersonalExterno);
            if (!ValidacionRelacion.Estatus)
                return ValidacionRelacion;

            MsjDB = ObjDAL.Ejecutar(Query(TipoDAL.Eliminar, Obj: Obj), Key: false, tipoDAL: TipoDAL.Eliminar);

            if (MsjDB.Estatus == true)
            {
                LogModificacionDAO.Registrar("PersonalExterno", "ELIMINADO", "CodPersonalExterno:" + Obj.CodPersonalExterno, Anterior: ObjAnterior);
            }

            return MsjDB;
        }

        internal bool VerificarPersonalExterno(PersonalExternoDTO Obj)
        {
            return ObjDAL.EjecutarExiste(Query(TipoDAL.Verificacion, Obj: Obj));
        }

        internal int ObtenerVersion(int CodPersonalExterno)
        {
            return ObjDAL.EjecutarScalar(Query(TipoDAL.Version, CodKey: CodPersonalExterno), 1);
        }

        internal List<PersonalExternoDTO> Log(int CodPersonalExterno)
        {
            return ObjDAL.EjecutarReader(Query(TipoDAL.Log, CodKey: CodPersonalExterno), MapPersonalExternoLog);
        }

        internal byte[] LeerFoto(PersonalExternoDTO personal)
        {
            if (string.IsNullOrWhiteSpace(personal.FotoRutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(personal.FotoRutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        internal PersonalExternoAdjuntoDTO ObtenerAdjunto(int CodPersonalExterno, int CodPersonalExternoAdjunto)
        {
            if (!ExisteTablaAdjuntos())
                return new PersonalExternoAdjuntoDTO();

            return ObjDAL
                .EjecutarReader(QueryObtenerAdjunto(CodPersonalExterno, CodPersonalExternoAdjunto), MapAdjunto)
                .FirstOrDefault()
                ?? new PersonalExternoAdjuntoDTO();
        }

        internal byte[] LeerArchivoAdjunto(PersonalExternoAdjuntoDTO adjunto)
        {
            if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                return Array.Empty<byte>();

            string ruta = RutaAbsolutaDesdeRelativa(adjunto.RutaArchivo);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        internal string Query(TipoDAL TipoDAL = TipoDAL.NoSeleccionado, int CodKey = 0, PersonalExternoDTO? Obj = null)
        {
            PersonalExternoDTO obj = Obj ?? new PersonalExternoDTO();

            switch (TipoDAL)
            {
                case TipoDAL.Agregar:
                    return "INSERT INTO PersonalExterno (CodPersonalExterno,CodCompaniaInspeccion,CodTecnico,Nombre,Puesto,EsTecnico,"
                            + "FotoNombreArchivo,FotoTipoContenido,FotoTamanoBytes,FotoRutaArchivo,Estatus,Version,CodUsuarioCreacion,FechaCreacion,AccionLog) "
                            + "VALUES('"
                            + obj.CodPersonalExterno + "','"
                            + obj.CodCompaniaInspeccion + "',N'"
                            + SqlTexto(obj.CodTecnico) + "',N'"
                            + SqlTexto(obj.Nombre) + "',N'"
                            + SqlTexto(obj.Puesto) + "','"
                            + (obj.EsTecnico ? "1" : "0") + "',"
                            + SqlNulo(obj.FotoNombreArchivo) + ","
                            + SqlNulo(obj.FotoTipoContenido) + ","
                            + obj.FotoTamanoBytes + ","
                            + SqlNulo(obj.FotoRutaArchivo) + ",'"
                            + (obj.Estatus ? "1" : "0") + "','"
                            + obj.Version + "',N'"
                            + SqlTexto(obj.CodUsuarioCreacion) + "',GETDATE(),'C')";
                case TipoDAL.Editar:
                    return "UPDATE PersonalExterno SET "
                            + "CodCompaniaInspeccion='" + obj.CodCompaniaInspeccion + "',"
                            + "CodTecnico=N'" + SqlTexto(obj.CodTecnico) + "',"
                            + "Nombre=N'" + SqlTexto(obj.Nombre) + "',"
                            + "Puesto=N'" + SqlTexto(obj.Puesto) + "',"
                            + "EsTecnico='" + (obj.EsTecnico ? "1" : "0") + "',"
                            + "FotoNombreArchivo=" + SqlNulo(obj.FotoNombreArchivo) + ","
                            + "FotoTipoContenido=" + SqlNulo(obj.FotoTipoContenido) + ","
                            + "FotoTamanoBytes=" + obj.FotoTamanoBytes + ","
                            + "FotoRutaArchivo=" + SqlNulo(obj.FotoRutaArchivo) + ","
                            + "Estatus='" + (obj.Estatus ? "1" : "0") + "',"
                            + "Version=" + obj.Version + ","
                            + "CodUsuarioActualizacion=N'" + SqlTexto(obj.CodUsuarioActualizacion) + "',"
                            + "FechaActualizacion=GETDATE(),"
                            + "AccionLog='U' "
                            + "WHERE CodPersonalExterno='" + obj.CodPersonalExterno + "'";
                case TipoDAL.Eliminar:
                    return "IF OBJECT_ID('dbo.PersonalExternoAdjunto', 'U') IS NOT NULL "
                            + "DELETE FROM dbo.PersonalExternoAdjunto "
                            + "WHERE CodPersonalExternoArchivo='" + obj.CodPersonalExterno + "'; "
                            + "DELETE FROM PersonalExterno WHERE CodPersonalExterno='" + obj.CodPersonalExterno + "'";
                case TipoDAL.Listado:
                    return SelectBase() + " ";
                case TipoDAL.Listar:
                    return QueryListar();
                case TipoDAL.Obtener:
                    return SelectBase() + "WHERE A.[CodPersonalExterno]='" + CodKey + "'";
                case TipoDAL.ObtenerKey:
                    return "SELECT ISNULL(MAX(A.[CodPersonalExterno]),0)+1 as 'CodPersonalExterno' FROM PersonalExterno A ";
                case TipoDAL.Verificacion:
                    return "SELECT 1 FROM PersonalExterno A "
                        + "WHERE A.[CodCompaniaInspeccion]='" + obj.CodCompaniaInspeccion + "' "
                        + "AND A.[CodTecnico]=N'" + SqlTexto(obj.CodTecnico) + "' "
                        + "AND A.[CodTecnico] <> N'' "
                        + "AND A.[CodPersonalExterno] <> '" + obj.CodPersonalExterno + "'";
                case TipoDAL.Version:
                    return "SELECT ISNULL(MAX(A.[Version]),0)+1 as 'Version' FROM (SELECT * FROM PersonalExterno_LOG UNION ALL SELECT * FROM PersonalExterno) A "
                        + "WHERE A.[CodPersonalExterno]='" + CodKey + "'";
                case TipoDAL.Log:
                    return "SELECT A.[CodPersonalExterno],A.[CodCompaniaInspeccion],ISNULL(C.[NombreComercial], '') AS [CompaniaInspeccion],"
                      + "A.[CodTecnico],A.[Nombre],A.[Puesto],A.[EsTecnico],"
                      + "A.[FotoNombreArchivo],A.[FotoTipoContenido],A.[FotoTamanoBytes],A.[FotoRutaArchivo],"
                      + "A.[Estatus],A.[Version],A.[CodUsuarioCreacion],A.[FechaCreacion],"
                      + "A.[CodUsuarioActualizacion],A.[FechaActualizacion],A.[CodUsuarioEliminacion],A.[FechaEliminacion],A.[AccionLog] "
                      + "FROM (SELECT * FROM PersonalExterno_LOG UNION ALL SELECT * FROM PersonalExterno) A "
                      + "LEFT JOIN CompaniaInspeccion C ON A.[CodCompaniaInspeccion] = C.[CodCompaniaInspeccion] "
                      + "WHERE A.[CodPersonalExterno] = '" + CodKey + "' "
                      + "ORDER BY A.Version ";
                default:
                    return "";
            }
        }

        private string SelectBase()
        {
            return "SELECT A.[CodPersonalExterno],A.[CodCompaniaInspeccion],ISNULL(C.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[CodTecnico],A.[Nombre],A.[Puesto],A.[EsTecnico],"
                + "A.[FotoNombreArchivo],A.[FotoTipoContenido],A.[FotoTamanoBytes],A.[FotoRutaArchivo],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus] "
                + "FROM PersonalExterno A "
                + "LEFT JOIN CompaniaInspeccion C ON A.[CodCompaniaInspeccion] = C.[CodCompaniaInspeccion] ";
        }

        private string QueryListado(PaginacionParametros paginacion, int CodCompaniaInspeccion = 0)
        {
            Dictionary<string, string> sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["codPersonalExterno"] = "A.[CodPersonalExterno]",
                ["codCompaniaInspeccion"] = "A.[CodCompaniaInspeccion]",
                ["companiaInspeccion"] = "C.[NombreComercial]",
                ["codTecnico"] = "A.[CodTecnico]",
                ["nombre"] = "A.[Nombre]",
                ["puesto"] = "A.[Puesto]",
                ["esTecnico"] = "A.[EsTecnico]",
                ["estatus"] = "A.[Estatus]"
            };
            string where = "WHERE 1 = 1 "
                + (CodCompaniaInspeccion > 0 ? "AND A.[CodCompaniaInspeccion] = " + CodCompaniaInspeccion + " " : "")
                + PaginacionSql.WhereBusqueda(paginacion.Search, new[]
                {
                    "CONVERT(VARCHAR(20), A.[CodPersonalExterno])",
                    "CONVERT(VARCHAR(20), A.[CodCompaniaInspeccion])",
                    "C.[NombreComercial]",
                    "A.[CodTecnico]",
                    "A.[Nombre]",
                    "A.[Puesto]",
                    "CONVERT(VARCHAR(5), A.[EsTecnico])",
                    "CONVERT(VARCHAR(5), A.[Estatus])"
                });
            string orderBy = PaginacionSql.OrderBy(paginacion.Sort, sortColumns, "A.[CodPersonalExterno] ASC");

            return "SELECT A.[CodPersonalExterno],A.[CodCompaniaInspeccion],ISNULL(C.[NombreComercial], '') AS [CompaniaInspeccion],"
                + "A.[CodTecnico],A.[Nombre],A.[Puesto],A.[EsTecnico],"
                + "A.[FotoNombreArchivo],A.[FotoTipoContenido],A.[FotoTamanoBytes],A.[FotoRutaArchivo],"
                + "ISNULL(A.[Estatus], 1) AS [Estatus], "
                + "COUNT(1) OVER() AS [" + PaginacionSql.TotalRegistrosAlias + "] "
                + "FROM PersonalExterno A "
                + "LEFT JOIN CompaniaInspeccion C ON A.[CodCompaniaInspeccion] = C.[CodCompaniaInspeccion] "
                + where
                + "ORDER BY " + orderBy
                + PaginacionSql.OffsetFetch(paginacion);
        }

        private string QueryListar(int CodCompaniaInspeccion = 0)
        {
            return "SELECT A.[CodPersonalExterno],A.[Nombre] FROM PersonalExterno A "
                + "WHERE ISNULL(A.[Estatus], 1)=1 "
                + (CodCompaniaInspeccion > 0 ? "AND A.[CodCompaniaInspeccion] = '" + CodCompaniaInspeccion + "' " : "")
                + "ORDER BY A.[Nombre] ";
        }

        private List<PersonalExternoAdjuntoDTO> ListarAdjuntos(int CodPersonalExterno)
        {
            if (!ExisteTablaAdjuntos())
                return new List<PersonalExternoAdjuntoDTO>();

            return ObjDAL.EjecutarReader(QueryListarAdjuntos(CodPersonalExterno), MapAdjunto);
        }

        private MsjDB GuardarAdjuntos(PersonalExternoDTO Obj)
        {
            Obj.Adjuntos ??= new List<PersonalExternoAdjuntoDTO>();

            if (Obj.Adjuntos.Count == 0 && !ExisteTablaAdjuntos())
                return Ok();

            if (!ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de personal externo no existe.");

            return ObjDAL.Ejecutar(QueryGuardarAdjuntos(Obj), Key: false);
        }

        private MsjDB PrepararAdjuntos(PersonalExternoDTO Obj)
        {
            Obj.Adjuntos ??= new List<PersonalExternoAdjuntoDTO>();

            if (Obj.Adjuntos.Count > 0 && !ExisteTablaAdjuntos())
                return Error("La tabla de adjuntos de personal externo no existe.");

            if (Obj.Adjuntos.Count > MaxAdjuntos)
                return Error("El personal externo puede tener maximo " + MaxAdjuntos + " archivos.");

            List<PersonalExternoAdjuntoDTO> adjuntos = new List<PersonalExternoAdjuntoDTO>();
            foreach (PersonalExternoAdjuntoDTO adjunto in Obj.Adjuntos)
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
                    adjunto.RutaArchivo = GuardarArchivoAdjuntoFisico(Obj.CodPersonalExterno, adjunto, contenido);
                    adjunto.ContenidoBase64 = "";
                }
                else if (string.IsNullOrWhiteSpace(adjunto.RutaArchivo))
                {
                    return Error("El archivo es requerido.");
                }

                adjunto.CodPersonalExterno = Obj.CodPersonalExterno;
                adjuntos.Add(adjunto);
            }

            Obj.Adjuntos = adjuntos;
            Obj.AdjuntoCantidad = adjuntos.Count;
            return Ok();
        }

        private bool ExisteTablaAdjuntos()
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('dbo.PersonalExternoAdjunto')");
        }

        private string QueryListarAdjuntos(int CodPersonalExterno)
        {
            return "SELECT CodPersonalExternoAdjunto,CodPersonalExternoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.PersonalExternoAdjunto "
                + "WHERE CodPersonalExternoArchivo='" + CodPersonalExterno + "' "
                + "ORDER BY CodPersonalExternoAdjunto";
        }

        private string QueryObtenerAdjunto(int CodPersonalExterno, int CodPersonalExternoAdjunto)
        {
            return "SELECT CodPersonalExternoAdjunto,CodPersonalExternoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo "
                + "FROM dbo.PersonalExternoAdjunto "
                + "WHERE CodPersonalExternoArchivo='" + CodPersonalExterno + "' "
                + "AND CodPersonalExternoAdjunto='" + CodPersonalExternoAdjunto + "'";
        }

        private string QueryGuardarAdjuntos(PersonalExternoDTO Obj)
        {
            string sql = "DELETE FROM dbo.PersonalExternoAdjunto "
                + "WHERE CodPersonalExternoArchivo='" + Obj.CodPersonalExterno + "'; "
                + "DECLARE @CodPersonalExternoAdjunto INT; ";

            foreach (PersonalExternoAdjuntoDTO adjunto in Obj.Adjuntos)
            {
                sql += "IF COLUMNPROPERTY(OBJECT_ID('dbo.PersonalExternoAdjunto'), 'CodPersonalExternoAdjunto', 'IsIdentity') = 1 "
                    + "BEGIN "
                    + "INSERT INTO dbo.PersonalExternoAdjunto "
                    + "(CodPersonalExternoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES('"
                    + Obj.CodPersonalExterno + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END "
                    + "ELSE "
                    + "BEGIN "
                    + "SELECT @CodPersonalExternoAdjunto = ISNULL(MAX(CodPersonalExternoAdjunto), 0) + 1 "
                    + "FROM dbo.PersonalExternoAdjunto WITH (UPDLOCK, HOLDLOCK); "
                    + "INSERT INTO dbo.PersonalExternoAdjunto "
                    + "(CodPersonalExternoAdjunto,CodPersonalExternoArchivo,NombreArchivo,TipoContenido,TamanoBytes,RutaArchivo) "
                    + "VALUES(@CodPersonalExternoAdjunto,'"
                    + Obj.CodPersonalExterno + "',N'"
                    + SqlTexto(adjunto.NombreArchivo) + "',N'"
                    + SqlTexto(adjunto.TipoContenido) + "',"
                    + adjunto.TamanoBytes + ",N'"
                    + SqlTexto(adjunto.RutaArchivo) + "'); "
                    + "END ";
            }

            return sql;
        }

        private MsjDB Validar(PersonalExternoDTO Obj)
        {
            Normalizar(Obj);

            if (Obj.CodCompaniaInspeccion <= 0)
                return ManejadorErrores.Validacion(TipoError.CamposRequeridos, "CodCompaniaInspeccion");

            if (!CompaniaInspeccionExiste(Obj.CodCompaniaInspeccion))
                return ManejadorErrores.Validacion(TipoError.RegistroNoEncontrado, "CompaniaInspeccion");

            if (VerificarPersonalExterno(Obj))
                return ManejadorErrores.Validacion(TipoError.RegistroDuplicado, "CodTecnico");

            return Ok();
        }

        private bool CompaniaInspeccionExiste(int CodCompaniaInspeccion)
        {
            return ObjDAL.EjecutarExiste("SELECT 1 FROM CompaniaInspeccion WHERE CodCompaniaInspeccion='" + CodCompaniaInspeccion + "'");
        }

        private void Normalizar(PersonalExternoDTO Obj)
        {
            Obj.CodTecnico = (Obj.CodTecnico ?? "").Trim();
            Obj.Nombre = (Obj.Nombre ?? "").Trim();
            Obj.Puesto = (Obj.Puesto ?? "").Trim();
        }

        private MsjDB PrepararFoto(PersonalExternoDTO Obj)
        {
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
                return Error("Solo se permiten imagenes .jpg, .jpeg o .png para la foto del personal externo.");

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
            Obj.FotoRutaArchivo = GuardarFotoFisica(Obj.CodPersonalExterno, Obj, contenido);
            Obj.FotoContenidoBase64 = "";
            return Ok();
        }

        private string GuardarFotoFisica(int CodPersonalExterno, PersonalExternoDTO Obj, byte[] contenido)
        {
            string carpeta = CarpetaPersonalExterno(CodPersonalExterno);
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionPermitida(Obj.FotoNombreArchivo, Obj.FotoTipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(Obj.FotoNombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string nombreArchivo = "PEXT" + CodPersonalExterno + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "PersonalExterno", "PEXT" + CodPersonalExterno, nombreArchivo);
        }

        private string GuardarArchivoAdjuntoFisico(int CodPersonalExterno, PersonalExternoAdjuntoDTO adjunto, byte[] contenido)
        {
            string carpeta = CarpetaPersonalExterno(CodPersonalExterno);
            Directory.CreateDirectory(carpeta);

            string extension = ExtensionAdjuntoPermitida(adjunto.NombreArchivo, adjunto.TipoContenido);
            string nombreBase = NombreArchivoSeguro(Path.GetFileNameWithoutExtension(adjunto.NombreArchivo));
            string sufijo = Guid.NewGuid().ToString("N").Substring(0, 8);
            string nombreArchivo = "PEXT" + CodPersonalExterno + "_ADJ_" + DateTime.Now.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture) + "_" + sufijo + "_" + nombreBase + extension;
            string rutaAbsoluta = Path.Combine(carpeta, nombreArchivo);
            File.WriteAllBytes(rutaAbsoluta, contenido);

            return Path.Combine("Archivos", "PersonalExterno", "PEXT" + CodPersonalExterno, nombreArchivo);
        }

        private string CarpetaPersonalExterno(int CodPersonalExterno)
        {
            return Path.Combine(CarpetaRaizPersonalExterno(), "PEXT" + CodPersonalExterno);
        }

        private string CarpetaRaizPersonalExterno()
        {
            return Path.Combine(Directory.GetCurrentDirectory(), "Archivos", "PersonalExterno");
        }

        private string RutaAbsolutaDesdeRelativa(string rutaRelativa)
        {
            string raiz = Path.GetFullPath(CarpetaRaizPersonalExterno());
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

        private string ExtensionAdjuntoPermitida(string nombreArchivo, string tipoContenido)
        {
            return app.ArchivoPermitido.ExtensionPermitida(nombreArchivo, tipoContenido, permitirPdf: true);
        }

        private string NormalizarTipoContenido(string? tipoContenido, string nombreArchivo)
        {
            return app.ArchivoPermitido.NormalizarTipoContenido(tipoContenido, nombreArchivo, permitirPdf: false);
        }

        private string NormalizarTipoAdjunto(string? tipoContenido, string nombreArchivo)
        {
            return app.ArchivoPermitido.NormalizarTipoContenido(tipoContenido, nombreArchivo, permitirPdf: true);
        }

        private string NormalizarContenidoBase64(string? contenido)
        {
            return app.ArchivoPermitido.NormalizarContenidoBase64(contenido);
        }

        private bool TipoFotoPermitido(string tipoContenido)
        {
            return app.ArchivoPermitido.TipoContenidoPermitido(tipoContenido, permitirPdf: false);
        }

        private bool TipoAdjuntoPermitido(string tipoContenido)
        {
            return app.ArchivoPermitido.TipoContenidoPermitido(tipoContenido, permitirPdf: true);
        }

        private PersonalExternoDTO MapPersonalExterno(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            PersonalExternoDTO Obj = new PersonalExternoDTO();
            Obj.CodPersonalExterno = Convert.ToInt32(reader["CodPersonalExterno"]);
            Obj.IdPersonalExterno = ObjEncriptacion.Encriptar(Obj.CodPersonalExterno.ToString());
            Obj.CodCompaniaInspeccion = Convert.ToInt32(reader["CodCompaniaInspeccion"]);
            Obj.IdCompaniaInspeccion = ObjEncriptacion.Encriptar(Obj.CodCompaniaInspeccion.ToString());
            Obj.CompaniaInspeccion = reader["CompaniaInspeccion"].ToString() ?? "";
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

        private PersonalExternoAdjuntoDTO MapAdjunto(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            PersonalExternoAdjuntoDTO adjunto = new PersonalExternoAdjuntoDTO
            {
                CodPersonalExternoAdjunto = Int(reader["CodPersonalExternoAdjunto"]),
                CodPersonalExterno = Int(reader["CodPersonalExternoArchivo"]),
                NombreArchivo = reader["NombreArchivo"].ToString() ?? "",
                TipoContenido = NormalizarTipoAdjunto(reader["TipoContenido"].ToString(), reader["NombreArchivo"].ToString() ?? ""),
                TamanoBytes = Long(reader["TamanoBytes"]),
                RutaArchivo = reader["RutaArchivo"].ToString() ?? ""
            };

            return adjunto;
        }

        private PersonalExternoDTO MapPersonalExternoLog(Microsoft.Data.SqlClient.SqlDataReader reader)
        {
            PersonalExternoDTO Obj = MapPersonalExterno(reader);
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
