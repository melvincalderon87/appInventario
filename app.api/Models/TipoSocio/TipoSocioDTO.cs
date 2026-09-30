using System.ComponentModel.DataAnnotations;

namespace app.Models.Socio
{
    /// <summary>
    /// DTO que representa un socio del sistema.
    /// </summary>
    public class SocioDTO
    {
        /// <summary>
        /// Identificador del socio en formato encriptado.
        /// </summary>
        public string? IdSocio { get; set; }

        /// <summary>
        /// Codigo del socio.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de socio debe tener maximo 20 caracteres.")]
        public string CodSocio { get; set; } = "";

        /// <summary>
        /// Nombre del socio.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Socio { get; set; } = "";

        /// <summary>
        /// Nombre corto del socio.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(10, ErrorMessage = "El nombre corto del socio debe tener maximo 10 caracteres de longitud.")]
        public string NombreCortoSocio { get; set; } = "";

        /// <summary>
        /// Indica si el socio se encuentra activo.
        /// </summary>
        public bool Estatus { get; set; } = true;

        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int Version { get; set; }

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
