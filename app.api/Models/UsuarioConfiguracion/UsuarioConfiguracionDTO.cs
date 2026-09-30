using app.Models.Roles;
using app.Models.TipoUsuarios;
using app.Models.Usuarios;

namespace app.Models.UsuarioConfiguraciones
{
    /// <summary>
    /// DTO que representa la configuracion de un usuario.
    /// </summary>
    public class UsuarioConfiguracionDTO
    {
        /// <summary>
        /// Identificador del usuario en formato encriptado.
        /// </summary>
        public string IdUsuario { get; set; }

        /// <summary>
        /// Codigo unico del usuario.
        /// </summary>
        public string CodUsuario { get; set; }

        /// <summary>
        /// Informacion del usuario configurado.
        /// </summary>
        public virtual UsuarioDTO? Usuario { get; set; }

        /// <summary>
        /// Codigo del tipo de usuario asignado.
        /// </summary>
        public int CodTipoUsuario { get; set; }

        /// <summary>
        /// Informacion del tipo de usuario asignado.
        /// </summary>
        public virtual TipoUsuarioDTO? TipoUsuario { get; set; }

        /// <summary>
        /// Codigo del rol asignado al usuario.
        /// </summary>
        public int CodRol { get; set; }

        /// <summary>
        /// Informacion del rol asignado al usuario.
        /// </summary>
        public virtual RolDTO? Rol { get; set; }
        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int? Version { get; set; }

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
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
