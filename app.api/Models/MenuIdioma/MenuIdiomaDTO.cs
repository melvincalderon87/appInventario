using System.ComponentModel.DataAnnotations;

namespace app.Models.MenuIdioma
{
    /// <summary>
    /// DTO que representa la traduccion de un menu por idioma.
    /// </summary>
    public class MenuIdiomaDTO
    {
        /// <summary>
        /// Identificador encriptado de MenuIdioma (CodMenu|Idioma).
        /// </summary>
        public string? IdMenuIdioma { get; set; }

        /// <summary>
        /// Codigo del menu al que aplica la traduccion.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodMenu { get; set; }

        /// <summary>
        /// Codigo de idioma (PK de Idioma).
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Idioma { get; set; }

        /// <summary>
        /// Descripcion localizada del menu.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Descripcion { get; set; }

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
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
