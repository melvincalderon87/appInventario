using System.ComponentModel.DataAnnotations;

namespace app.Models.ConfiguracionCorreo
{
    /// <summary>
    /// DTO que representa la configuracion de correo del sistema.
    /// </summary>
    public class ConfiguracionCorreoDTO
    {
        /// <summary>
        /// Identificador de la configuracion de correo en formato encriptado.
        /// </summary>
        public string? IdConfiguracionCorreo { get; set; }

        /// <summary>
        /// Codigo numerico de la configuracion de correo.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodConfiguracionCorreo { get; set; }

        /// <summary>
        /// Descripcion de la configuracion.
        /// </summary>
        [StringLength(100)]
        public string Descripcion { get; set; } = "";

        /// <summary>
        /// Direccion de correo emisora.
        /// </summary>
        [StringLength(150)]
        public string DireccionCorreo { get; set; } = "";

        /// <summary>
        /// Nombre de usuario del servidor de correo.
        /// </summary>
        [StringLength(150)]
        public string NombreUsuario { get; set; } = "";

        /// <summary>
        /// Password del servidor de correo.
        /// </summary>
        [StringLength(50)]
        public string Password { get; set; } = "";

        /// <summary>
        /// Proveedor de autenticacion de correo.
        /// </summary>
        [StringLength(30)]
        public string ProveedorAutenticacion { get; set; } = "SMTP";

        /// <summary>
        /// Tipo de autenticacion utilizado por el servidor de correo.
        /// </summary>
        [StringLength(30)]
        public string TipoAutenticacion { get; set; } = "Password";

        /// <summary>
        /// Servidor de salida SMTP.
        /// </summary>
        [StringLength(150)]
        public string ServidorSalida { get; set; } = "";

        /// <summary>
        /// Puerto de salida SMTP.
        /// </summary>
        public int PuertoSalida { get; set; }

        /// <summary>
        /// Indica si el servidor de salida utiliza SSL.
        /// </summary>
        public bool SSLSalida { get; set; }

        /// <summary>
        /// Tenant de Office 365 o proveedor OAuth2.
        /// </summary>
        [StringLength(150)]
        public string TenantId { get; set; } = "";

        /// <summary>
        /// Client Id de la aplicacion OAuth2.
        /// </summary>
        [StringLength(150)]
        public string ClientId { get; set; } = "";

        /// <summary>
        /// Client Secret de la aplicacion OAuth2.
        /// </summary>
        [StringLength(250)]
        public string ClientSecret { get; set; } = "";

        /// <summary>
        /// Redirect URI registrada para OAuth2.
        /// </summary>
        [StringLength(250)]
        public string RedirectUri { get; set; } = "";

        /// <summary>
        /// URL de autorizacion OAuth2.
        /// </summary>
        [StringLength(500)]
        public string AuthorizationUrl { get; set; } = "";

        /// <summary>
        /// URL para intercambio y refresco de tokens OAuth2.
        /// </summary>
        [StringLength(500)]
        public string TokenUrl { get; set; } = "";

        /// <summary>
        /// Scopes requeridos para el proveedor OAuth2.
        /// </summary>
        [StringLength(500)]
        public string Scope { get; set; } = "";

        /// <summary>
        /// Refresh token OAuth2.
        /// </summary>
        public string RefreshToken { get; set; } = "";

        /// <summary>
        /// Access token OAuth2 vigente.
        /// </summary>
        public string AccessToken { get; set; } = "";

        /// <summary>
        /// Fecha de expiracion del access token OAuth2.
        /// </summary>
        public DateTime? FechaExpiracionToken { get; set; }

        /// <summary>
        /// Fecha de ultima autenticacion exitosa.
        /// </summary>
        public DateTime? FechaUltimaAutenticacion { get; set; }

        /// <summary>
        /// Estado de la autenticacion OAuth2.
        /// </summary>
        [StringLength(30)]
        public string EstatusAutenticacion { get; set; } = "Pendiente";

        /// <summary>
        /// Ultimo error de autenticacion reportado por el proveedor.
        /// </summary>
        [StringLength(1000)]
        public string UltimoErrorAutenticacion { get; set; } = "";

        /// <summary>
        /// Estado de la configuracion.
        /// </summary>
        public bool Estatus { get; set; } = true;

        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int Version { get; set; }

        /// <summary>
        /// Codigo del usuario que creo el registro.
        /// </summary>
        public string? CodUsuarioCreacion { get; set; }

        /// <summary>
        /// Identificador del usuario que creo el registro.
        /// </summary>
        public string? IdUsuarioCreacion { get; set; }

        /// <summary>
        /// Fecha de creacion del registro.
        /// </summary>
        public DateTime? FechaCreacion { get; set; }

        /// <summary>
        /// Codigo del usuario que actualizo el registro.
        /// </summary>
        public string? CodUsuarioActualizacion { get; set; }

        /// <summary>
        /// Identificador del usuario que actualizo el registro.
        /// </summary>
        public string? IdUsuarioActualizacion { get; set; }

        /// <summary>
        /// Fecha de ultima actualizacion del registro.
        /// </summary>
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
