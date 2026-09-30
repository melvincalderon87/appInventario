using System.ComponentModel.DataAnnotations;

namespace app.Models.Idioma
{
    /// <summary>
    /// DTO que representa un idioma del sistema.
    /// </summary>
    public class IdiomaDTO
    {
        /// <summary>
        /// Identificador del idioma en formato encriptado.
        /// </summary>
        public string? IdIdioma { get; set; }

        /// <summary>
        /// Clave alfanumerica del idioma (PK).
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Idioma { get; set; }

        /// <summary>
        /// Descripcion del idioma.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Descripcion { get; set; }

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
