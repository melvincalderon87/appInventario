using app.Models.Usuarios;

namespace app.Models.UsuarioPreferencias
{
    /// <summary>
    /// DTO que representa las preferencias de un usuario.
    /// </summary>
    public class UsuarioPreferenciaDTO
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
        /// Informacion del usuario asociado a las preferencias.
        /// </summary>
        public virtual UsuarioDTO? Usuario { get; set; }

        /// <summary>
        /// Idioma preferido por el usuario.
        /// </summary>
        public string Idioma { get; set; }

        /// <summary>
        /// Tema visual preferido por el usuario.
        /// </summary>
        public string Theme { get; set; } = "bluedark";
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
