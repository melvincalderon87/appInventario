using app.Models.LogModificaciones;
using Microsoft.Data.SqlClient;
using System.Globalization;

namespace app.Models.ConfiguracionSistema
{
    /// <summary>Acceso a datos del modulo ConfiguracionSistema.</summary>
    internal class ConfiguracionSistemaDAO
    {
        private const int CodigoUnico = 1;
        private const int MaxArchivoBytes = app.ArchivoPermitido.MaxArchivoBytes;
        private readonly DAL ObjDAL = new DAL();
        private readonly Encriptacion ObjEncriptacion = new Encriptacion();

        internal ConfiguracionSistemaDTO Obtener()
        {
            AsegurarTablas();
            return new ConfiguracionSistemaDTO
            {
                Empresa = ObtenerEmpresa(),
                Fondo = ObtenerFondo()
            };
        }

        internal MsjDB GuardarEmpresa(ConfiguracionSistemaEmpresaDTO obj)
        {
            AsegurarTablas();
            ConfiguracionSistemaEmpresaDTO anterior = ObtenerEmpresa();
            bool existe = anterior.Version > 0;
            obj ??= new ConfiguracionSistemaEmpresaDTO();
            obj.CodConfiguracionSistema = CodigoUnico;
            obj.Version = existe ? anterior.Version + 1 : 1;
            MsjDB archivo = PrepararLogo(obj, anterior);
            if (!archivo.Estatus) return archivo;

            string usuario = new VerificarUsuario().SesionUsuario();
            obj.CodUsuarioCreacion = existe ? anterior.CodUsuarioCreacion : usuario;
            obj.CodUsuarioActualizacion = existe ? usuario : null;
            MsjDB resultado = ObjDAL.Ejecutar(existe ? SqlEditarEmpresa(obj) : SqlAgregarEmpresa(obj), Key: false, tipoDAL: existe ? TipoDAL.Editar : TipoDAL.Agregar);
            if (resultado.Estatus)
                LogModificacionDAO.Registrar("ConfiguracionSistemaEmpresa", existe ? "EDITADO" : "CREADO", "CodConfiguracionSistema:1", Anterior: existe ? anterior : null, Nuevo: obj);
            return resultado;
        }

        internal MsjDB GuardarFondo(ConfiguracionSistemaFondoDTO obj)
        {
            AsegurarTablas();
            ConfiguracionSistemaFondoDTO anterior = ObtenerFondo();
            bool existe = anterior.Version > 0;
            obj ??= new ConfiguracionSistemaFondoDTO();
            obj.CodConfiguracionSistema = CodigoUnico;
            obj.Version = existe ? anterior.Version + 1 : 1;
            MsjDB archivo = PrepararFondo(obj, anterior);
            if (!archivo.Estatus) return archivo;

            string usuario = new VerificarUsuario().SesionUsuario();
            obj.CodUsuarioCreacion = existe ? anterior.CodUsuarioCreacion : usuario;
            obj.CodUsuarioActualizacion = existe ? usuario : null;
            MsjDB resultado = ObjDAL.Ejecutar(existe ? SqlEditarFondo(obj) : SqlAgregarFondo(obj), Key: false, tipoDAL: existe ? TipoDAL.Editar : TipoDAL.Agregar);
            if (resultado.Estatus)
                LogModificacionDAO.Registrar("ConfiguracionSistemaFondo", existe ? "EDITADO" : "CREADO", "CodConfiguracionSistema:1", Anterior: existe ? anterior : null, Nuevo: obj);
            return resultado;
        }

        internal byte[] LeerFondo(out string tipoContenido) => LeerArchivo(ObtenerFondo().FondoRutaArchivo, ObtenerFondo().FondoTipoContenido, out tipoContenido);
        internal byte[] LeerLogo(out string tipoContenido) => LeerArchivo(ObtenerEmpresa().LogoRutaArchivo, ObtenerEmpresa().LogoTipoContenido, out tipoContenido);

        private ConfiguracionSistemaFondoDTO ObtenerFondo()
        {
            return ObjDAL.EjecutarReader("SELECT TOP 1 * FROM dbo.ConfiguracionSistemaFondo WHERE CodConfiguracionSistema=1", MapFondo).FirstOrDefault()
                ?? new ConfiguracionSistemaFondoDTO();
        }

        private ConfiguracionSistemaEmpresaDTO ObtenerEmpresa()
        {
            return ObjDAL.EjecutarReader("SELECT TOP 1 * FROM dbo.ConfiguracionSistemaEmpresa WHERE CodConfiguracionSistema=1", MapEmpresa).FirstOrDefault()
                ?? new ConfiguracionSistemaEmpresaDTO();
        }

        private void AsegurarTablas() => ObjDAL.Ejecutar(SqlEstructura(), Key: false);

        private string SqlEstructura()
        {
            return @"
IF OBJECT_ID('dbo.ConfiguracionSistemaFondo','U') IS NULL
CREATE TABLE dbo.ConfiguracionSistemaFondo (
 CodConfiguracionSistema INT NOT NULL PRIMARY KEY, FondoNombreArchivo NVARCHAR(260) NOT NULL DEFAULT(N''), FondoTipoContenido NVARCHAR(150) NOT NULL DEFAULT(N''), FondoTamanoBytes BIGINT NOT NULL DEFAULT(0), FondoRutaArchivo NVARCHAR(500) NOT NULL DEFAULT(N''), Version INT NOT NULL DEFAULT(1), CodUsuarioCreacion NVARCHAR(100) NOT NULL, FechaCreacion DATETIME NOT NULL, CodUsuarioActualizacion NVARCHAR(100) NULL, FechaActualizacion DATETIME NULL, CodUsuarioEliminacion NVARCHAR(100) NULL, FechaEliminacion DATETIME NULL, AccionLog CHAR(1) NOT NULL DEFAULT('C'));
IF OBJECT_ID('dbo.ConfiguracionSistemaFondo_LOG','U') IS NULL
CREATE TABLE dbo.ConfiguracionSistemaFondo_LOG (
 CodConfiguracionSistema INT NOT NULL, FondoNombreArchivo NVARCHAR(260) NOT NULL, FondoTipoContenido NVARCHAR(150) NOT NULL, FondoTamanoBytes BIGINT NOT NULL, FondoRutaArchivo NVARCHAR(500) NOT NULL, Version INT NOT NULL, CodUsuarioCreacion NVARCHAR(100) NOT NULL, FechaCreacion DATETIME NOT NULL, CodUsuarioActualizacion NVARCHAR(100) NULL, FechaActualizacion DATETIME NULL, CodUsuarioEliminacion NVARCHAR(100) NULL, FechaEliminacion DATETIME NULL, AccionLog CHAR(1) NOT NULL, CONSTRAINT PK_ConfiguracionSistemaFondo_LOG PRIMARY KEY(CodConfiguracionSistema,Version));
IF OBJECT_ID('dbo.ConfiguracionSistemaEmpresa','U') IS NULL
CREATE TABLE dbo.ConfiguracionSistemaEmpresa (
 CodConfiguracionSistema INT NOT NULL PRIMARY KEY, NombreComercial NVARCHAR(200) NOT NULL DEFAULT(N''), NombreFiscal NVARCHAR(250) NOT NULL DEFAULT(N''), Nit NVARCHAR(30) NOT NULL DEFAULT(N''), Direccion NVARCHAR(500) NOT NULL DEFAULT(N''), Telefono NVARCHAR(50) NOT NULL DEFAULT(N''), PaginaWeb NVARCHAR(250) NOT NULL DEFAULT(N''), LogoNombreArchivo NVARCHAR(260) NOT NULL DEFAULT(N''), LogoTipoContenido NVARCHAR(150) NOT NULL DEFAULT(N''), LogoTamanoBytes BIGINT NOT NULL DEFAULT(0), LogoRutaArchivo NVARCHAR(500) NOT NULL DEFAULT(N''), Version INT NOT NULL DEFAULT(1), CodUsuarioCreacion NVARCHAR(100) NOT NULL, FechaCreacion DATETIME NOT NULL, CodUsuarioActualizacion NVARCHAR(100) NULL, FechaActualizacion DATETIME NULL, CodUsuarioEliminacion NVARCHAR(100) NULL, FechaEliminacion DATETIME NULL, AccionLog CHAR(1) NOT NULL DEFAULT('C'));
IF OBJECT_ID('dbo.ConfiguracionSistemaEmpresa_LOG','U') IS NULL
CREATE TABLE dbo.ConfiguracionSistemaEmpresa_LOG (
 CodConfiguracionSistema INT NOT NULL, NombreComercial NVARCHAR(200) NOT NULL, NombreFiscal NVARCHAR(250) NOT NULL, Nit NVARCHAR(30) NOT NULL, Direccion NVARCHAR(500) NOT NULL, Telefono NVARCHAR(50) NOT NULL, PaginaWeb NVARCHAR(250) NOT NULL, LogoNombreArchivo NVARCHAR(260) NOT NULL, LogoTipoContenido NVARCHAR(150) NOT NULL, LogoTamanoBytes BIGINT NOT NULL, LogoRutaArchivo NVARCHAR(500) NOT NULL, Version INT NOT NULL, CodUsuarioCreacion NVARCHAR(100) NOT NULL, FechaCreacion DATETIME NOT NULL, CodUsuarioActualizacion NVARCHAR(100) NULL, FechaActualizacion DATETIME NULL, CodUsuarioEliminacion NVARCHAR(100) NULL, FechaEliminacion DATETIME NULL, AccionLog CHAR(1) NOT NULL, CONSTRAINT PK_ConfiguracionSistemaEmpresa_LOG PRIMARY KEY(CodConfiguracionSistema,Version));
IF OBJECT_ID('dbo.ConfiguracionSistema','U') IS NOT NULL
BEGIN
 INSERT INTO dbo.ConfiguracionSistemaFondo (CodConfiguracionSistema,FondoNombreArchivo,FondoTipoContenido,FondoTamanoBytes,FondoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog)
 SELECT CodConfiguracionSistema,FondoNombreArchivo,FondoTipoContenido,FondoTamanoBytes,FondoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog FROM dbo.ConfiguracionSistema O WHERE NOT EXISTS(SELECT 1 FROM dbo.ConfiguracionSistemaFondo N WHERE N.CodConfiguracionSistema=O.CodConfiguracionSistema);
 DROP TABLE dbo.ConfiguracionSistema;
END
IF OBJECT_ID('dbo.ConfiguracionSistema_LOG','U') IS NOT NULL
BEGIN
 INSERT INTO dbo.ConfiguracionSistemaFondo_LOG (CodConfiguracionSistema,FondoNombreArchivo,FondoTipoContenido,FondoTamanoBytes,FondoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog)
 SELECT CodConfiguracionSistema,FondoNombreArchivo,FondoTipoContenido,FondoTamanoBytes,FondoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,AccionLog FROM dbo.ConfiguracionSistema_LOG O WHERE NOT EXISTS(SELECT 1 FROM dbo.ConfiguracionSistemaFondo_LOG N WHERE N.CodConfiguracionSistema=O.CodConfiguracionSistema AND N.Version=O.Version);
 DROP TABLE dbo.ConfiguracionSistema_LOG;
END
IF OBJECT_ID('dbo.ConfiguracionSistemaFondo_TRG_LOG_U','TR') IS NULL EXEC('CREATE TRIGGER dbo.ConfiguracionSistemaFondo_TRG_LOG_U ON dbo.ConfiguracionSistemaFondo AFTER UPDATE AS BEGIN INSERT INTO dbo.ConfiguracionSistemaFondo_LOG SELECT CodConfiguracionSistema,FondoNombreArchivo,FondoTipoContenido,FondoTamanoBytes,FondoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,''U'' FROM deleted; END');
IF OBJECT_ID('dbo.ConfiguracionSistemaEmpresa_TRG_LOG_U','TR') IS NULL EXEC('CREATE TRIGGER dbo.ConfiguracionSistemaEmpresa_TRG_LOG_U ON dbo.ConfiguracionSistemaEmpresa AFTER UPDATE AS BEGIN INSERT INTO dbo.ConfiguracionSistemaEmpresa_LOG SELECT CodConfiguracionSistema,NombreComercial,NombreFiscal,Nit,Direccion,Telefono,PaginaWeb,LogoNombreArchivo,LogoTipoContenido,LogoTamanoBytes,LogoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion,CodUsuarioActualizacion,FechaActualizacion,CodUsuarioEliminacion,FechaEliminacion,''U'' FROM deleted; END');";
        }

        private string SqlAgregarFondo(ConfiguracionSistemaFondoDTO o) => "INSERT INTO dbo.ConfiguracionSistemaFondo (CodConfiguracionSistema,FondoNombreArchivo,FondoTipoContenido,FondoTamanoBytes,FondoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion) VALUES(1,N'" + Sql(o.FondoNombreArchivo) + "',N'" + Sql(o.FondoTipoContenido) + "'," + o.FondoTamanoBytes.ToString(CultureInfo.InvariantCulture) + ",N'" + Sql(o.FondoRutaArchivo) + "'," + o.Version + ",N'" + Sql(o.CodUsuarioCreacion) + "',GETDATE())";
        private string SqlEditarFondo(ConfiguracionSistemaFondoDTO o) => "UPDATE dbo.ConfiguracionSistemaFondo SET FondoNombreArchivo=N'" + Sql(o.FondoNombreArchivo) + "',FondoTipoContenido=N'" + Sql(o.FondoTipoContenido) + "',FondoTamanoBytes=" + o.FondoTamanoBytes.ToString(CultureInfo.InvariantCulture) + ",FondoRutaArchivo=N'" + Sql(o.FondoRutaArchivo) + "',Version=" + o.Version + ",CodUsuarioActualizacion=N'" + Sql(o.CodUsuarioActualizacion) + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodConfiguracionSistema=1";
        private string SqlAgregarEmpresa(ConfiguracionSistemaEmpresaDTO o) => "INSERT INTO dbo.ConfiguracionSistemaEmpresa (CodConfiguracionSistema,NombreComercial,NombreFiscal,Nit,Direccion,Telefono,PaginaWeb,LogoNombreArchivo,LogoTipoContenido,LogoTamanoBytes,LogoRutaArchivo,Version,CodUsuarioCreacion,FechaCreacion) VALUES(1,N'" + Sql(o.NombreComercial) + "',N'" + Sql(o.NombreFiscal) + "',N'" + Sql(o.Nit) + "',N'" + Sql(o.Direccion) + "',N'" + Sql(o.Telefono) + "',N'" + Sql(o.PaginaWeb) + "',N'" + Sql(o.LogoNombreArchivo) + "',N'" + Sql(o.LogoTipoContenido) + "'," + o.LogoTamanoBytes.ToString(CultureInfo.InvariantCulture) + ",N'" + Sql(o.LogoRutaArchivo) + "'," + o.Version + ",N'" + Sql(o.CodUsuarioCreacion) + "',GETDATE())";
        private string SqlEditarEmpresa(ConfiguracionSistemaEmpresaDTO o) => "UPDATE dbo.ConfiguracionSistemaEmpresa SET NombreComercial=N'" + Sql(o.NombreComercial) + "',NombreFiscal=N'" + Sql(o.NombreFiscal) + "',Nit=N'" + Sql(o.Nit) + "',Direccion=N'" + Sql(o.Direccion) + "',Telefono=N'" + Sql(o.Telefono) + "',PaginaWeb=N'" + Sql(o.PaginaWeb) + "',LogoNombreArchivo=N'" + Sql(o.LogoNombreArchivo) + "',LogoTipoContenido=N'" + Sql(o.LogoTipoContenido) + "',LogoTamanoBytes=" + o.LogoTamanoBytes.ToString(CultureInfo.InvariantCulture) + ",LogoRutaArchivo=N'" + Sql(o.LogoRutaArchivo) + "',Version=" + o.Version + ",CodUsuarioActualizacion=N'" + Sql(o.CodUsuarioActualizacion) + "',FechaActualizacion=GETDATE(),AccionLog='U' WHERE CodConfiguracionSistema=1";

        private MsjDB PrepararFondo(ConfiguracionSistemaFondoDTO o, ConfiguracionSistemaFondoDTO anterior) => PrepararImagen(o.FondoContenidoBase64, o.FondoNombreArchivo, o.FondoTipoContenido, anterior.FondoNombreArchivo, anterior.FondoTipoContenido, anterior.FondoTamanoBytes, anterior.FondoRutaArchivo, "Fondo.jpg", "ConfiguracionSistemaFondo", (n, t, s, r) => { o.FondoNombreArchivo = n; o.FondoTipoContenido = t; o.FondoTamanoBytes = s; o.FondoRutaArchivo = r; o.FondoContenidoBase64 = ""; });
        private MsjDB PrepararLogo(ConfiguracionSistemaEmpresaDTO o, ConfiguracionSistemaEmpresaDTO anterior) => PrepararImagen(o.LogoContenidoBase64, o.LogoNombreArchivo, o.LogoTipoContenido, anterior.LogoNombreArchivo, anterior.LogoTipoContenido, anterior.LogoTamanoBytes, anterior.LogoRutaArchivo, "Logo", "ConfiguracionSistemaEmpresa", (n, t, s, r) => { o.LogoNombreArchivo = n; o.LogoTipoContenido = t; o.LogoTamanoBytes = s; o.LogoRutaArchivo = r; o.LogoContenidoBase64 = ""; });

        private MsjDB PrepararImagen(string base64, string nombre, string tipo, string anteriorNombre, string anteriorTipo, long anteriorTamano, string anteriorRuta, string nombreFijo, string carpeta, Action<string, string, long, string> asignar)
        {
            if (string.IsNullOrWhiteSpace(base64)) { asignar(anteriorNombre, anteriorTipo, anteriorTamano, anteriorRuta); return Ok(); }
            try
            {
                byte[] contenido = Convert.FromBase64String(app.ArchivoPermitido.NormalizarContenidoBase64(base64));
                string tipoNormalizado = (tipo ?? "").ToLowerInvariant();
                bool jpeg = contenido.Length >= 3 && contenido[0] == 0xFF && contenido[1] == 0xD8 && contenido[2] == 0xFF;
                bool png = contenido.Length >= 8 && contenido[0] == 0x89 && contenido[1] == 0x50 && contenido[2] == 0x4E && contenido[3] == 0x47;
                if (contenido.Length == 0 || contenido.LongLength > MaxArchivoBytes || (!jpeg && !png)) return Error("El archivo debe ser una imagen JPEG o PNG valida de maximo 10 MB.");
                string extension = png ? ".png" : ".jpg";
                string rutaRelativa = Path.Combine("Archivos", carpeta, nombreFijo + extension);
                string ruta = Path.Combine(Directory.GetCurrentDirectory(), rutaRelativa);
                Directory.CreateDirectory(Path.GetDirectoryName(ruta)!); File.WriteAllBytes(ruta, contenido);
                asignar(nombreFijo + extension, png ? "image/png" : "image/jpeg", contenido.LongLength, rutaRelativa);
                return Ok();
            }
            catch { return Error("No fue posible leer la imagen seleccionada."); }
        }

        private byte[] LeerArchivo(string rutaRelativa, string tipo, out string tipoContenido)
        {
            tipoContenido = string.IsNullOrWhiteSpace(tipo) ? "image/jpeg" : tipo;
            if (string.IsNullOrWhiteSpace(rutaRelativa)) return Array.Empty<byte>();
            string ruta = Path.Combine(Directory.GetCurrentDirectory(), rutaRelativa);
            return File.Exists(ruta) ? File.ReadAllBytes(ruta) : Array.Empty<byte>();
        }

        private ConfiguracionSistemaFondoDTO MapFondo(SqlDataReader r) => new ConfiguracionSistemaFondoDTO { CodConfiguracionSistema = Convert.ToInt32(r["CodConfiguracionSistema"]), IdConfiguracionSistema = ObjEncriptacion.Encriptar("1"), FondoNombreArchivo = r["FondoNombreArchivo"].ToString() ?? "", FondoTipoContenido = r["FondoTipoContenido"].ToString() ?? "", FondoTamanoBytes = Convert.ToInt64(r["FondoTamanoBytes"]), FondoRutaArchivo = r["FondoRutaArchivo"].ToString() ?? "", Version = Convert.ToInt32(r["Version"]), CodUsuarioCreacion = r["CodUsuarioCreacion"].ToString(), FechaCreacion = Fecha(r["FechaCreacion"]), CodUsuarioActualizacion = r["CodUsuarioActualizacion"].ToString(), FechaActualizacion = Fecha(r["FechaActualizacion"]) };
        private ConfiguracionSistemaEmpresaDTO MapEmpresa(SqlDataReader r) => new ConfiguracionSistemaEmpresaDTO { CodConfiguracionSistema = Convert.ToInt32(r["CodConfiguracionSistema"]), IdConfiguracionSistema = ObjEncriptacion.Encriptar("1"), NombreComercial = r["NombreComercial"].ToString() ?? "", NombreFiscal = r["NombreFiscal"].ToString() ?? "", Nit = r["Nit"].ToString() ?? "", Direccion = r["Direccion"].ToString() ?? "", Telefono = r["Telefono"].ToString() ?? "", PaginaWeb = r["PaginaWeb"].ToString() ?? "", LogoNombreArchivo = r["LogoNombreArchivo"].ToString() ?? "", LogoTipoContenido = r["LogoTipoContenido"].ToString() ?? "", LogoTamanoBytes = Convert.ToInt64(r["LogoTamanoBytes"]), LogoRutaArchivo = r["LogoRutaArchivo"].ToString() ?? "", Version = Convert.ToInt32(r["Version"]), CodUsuarioCreacion = r["CodUsuarioCreacion"].ToString(), FechaCreacion = Fecha(r["FechaCreacion"]), CodUsuarioActualizacion = r["CodUsuarioActualizacion"].ToString(), FechaActualizacion = Fecha(r["FechaActualizacion"]) };
        private DateTime? Fecha(object v) => v == DBNull.Value ? null : Convert.ToDateTime(v);
        private string Sql(string? v) => (v ?? "").Replace("'", "''");
        private MsjDB Ok() => new MsjDB { Estatus = true };
        private MsjDB Error(string m) => new MsjDB { Estatus = false, Msj = m };
    }
}
