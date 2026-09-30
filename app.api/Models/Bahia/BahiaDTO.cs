using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace app.Models.Bahia
{
    /// <summary>
    /// DTO que representa una bahia del sistema.
    /// </summary>
    public class BahiaDTO
    {
        /// <summary>
        /// Identificador de la bahia en formato encriptado.
        /// </summary>
        public string? IdBahia { get; set; }

        /// <summary>
        /// Codigo de la bahia.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de bahia debe tener maximo 20 caracteres de longitud.")]
        public string CodBahia { get; set; } = "";

        /// <summary>
        /// Nombre de la bahia.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Bahia { get; set; } = "";

        /// <summary>
        /// Descripcion corta de la bahia.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(10, ErrorMessage = "La descripcion corta debe tener maximo 10 caracteres de longitud.")]
        public string DescripcionCorta { get; set; } = "";

        /// <summary>
        /// Cantidad de brazos configurados para la bahia.
        /// </summary>
        public int CantidadBrazos { get; set; }

        /// <summary>
        /// Cantidad de aditivos configurados para la bahia.
        /// </summary>
        public int CantidadAditivos { get; set; }

        /// <summary>
        /// Cantidad de etanol configurada para la bahia.
        /// </summary>
        public int CantidadEtanol { get; set; }

        /// <summary>
        /// Multiload asociado a la bahia.
        /// </summary>
        [StringLength(100, ErrorMessage = "El multiload debe tener maximo 100 caracteres de longitud.")]
        public string Multiload { get; set; } = "";

        /// <summary>
        /// Comentario de la bahia.
        /// </summary>
        [StringLength(250, ErrorMessage = "El comentario debe tener maximo 250 caracteres de longitud.")]
        public string Comentario { get; set; } = "";

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
        public int AdjuntoCantidad { get; set; }
        public List<BahiaAdjuntoDTO> Adjuntos { get; set; } = new List<BahiaAdjuntoDTO>();
    }
}
