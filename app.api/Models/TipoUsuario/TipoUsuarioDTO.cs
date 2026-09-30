using System.ComponentModel.DataAnnotations;

namespace app.Models.TipoUsuarios
{
    /// <summary>
    /// DTO que representa un tipo de usuario del sistema.
    /// </summary>
    public class TipoUsuarioDTO
    {
        /// <summary>
        /// Identificador del tipo de usuario en formato encriptado.
        /// </summary>
        public string? IdTipoUsuario { get; set; }

        /// <summary>
        /// Codigo numerico del tipo de usuario.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodTipoUsuario { get; set; }

        /// <summary>
        /// Descripcion del tipo de usuario.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Descripcion { get; set; }
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
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
