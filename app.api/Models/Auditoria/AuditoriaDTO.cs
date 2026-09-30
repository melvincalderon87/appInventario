namespace app.Models.Auditorias
{
    /// <summary>
    /// DTO que representa un registro de auditoria del sistema.
    /// </summary>
    public class AuditoriaDTO
    {
        /// <summary>
        /// Identificador encriptado de auditoria.
        /// </summary>
        public string IdAuditoria { get; set; } = "";

        /// <summary>
        /// Codigo correlativo de auditoria.
        /// </summary>
        public int CodAuditoria { get; set; }

        /// <summary>
        /// Codigo del usuario asociado a la auditoria.
        /// </summary>
        public string? CodUsuario { get; set; } = "";

        /// <summary>
        /// Identificador de la sesion del usuario.
        /// </summary>
        public string? SesionID { get; set; } = "";

        /// <summary>
        /// Direccion IP desde donde se hizo la solicitud.
        /// </summary>
        public string? IpAddress { get; set; } = "";

        /// <summary>
        /// Pagina o URL accedida durante la solicitud.
        /// </summary>
        public string? PaginaAccedida { get; set; } = "";

        /// <summary>
        /// Fecha y hora de conexion.
        /// </summary>
        public DateTime? Conectado { get; set; }

        /// <summary>
        /// Fecha y hora de desconexion.
        /// </summary>
        public DateTime? Desconectado { get; set; }

        /// <summary>
        /// Estado de la sesion registrada.
        /// </summary>
        public string? EstadoSesion { get; set; } = "";

        /// <summary>
        /// Nombre del controlador ejecutado.
        /// </summary>
        public string? Controlador { get; set; } = "";

        /// <summary>
        /// Nombre de la accion ejecutada.
        /// </summary>
        public string? Accion { get; set; } = "";

        /// <summary>
        /// URL completa de la solicitud.
        /// </summary>
        public string? Url { get; set; } = "";

        /// <summary>
        /// Metodo HTTP utilizado por la solicitud.
        /// </summary>
        public string? Metodo { get; set; } = "";
        public int Version { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
