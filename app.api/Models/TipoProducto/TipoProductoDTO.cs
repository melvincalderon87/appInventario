using System.ComponentModel.DataAnnotations;

namespace app.Models.TipoProducto
{
    /// <summary>
    /// DTO que representa un tipo de producto del sistema.
    /// </summary>
    public class TipoProductoDTO
    {
        /// <summary>
        /// Identificador del tipo de producto en formato encriptado.
        /// </summary>
        public string? IdTipoProducto { get; set; }

        /// <summary>
        /// Codigo alfanumerico del tipo de producto.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de tipo de producto debe tener maximo 20 caracteres de longitud.")]
        public string CodTipoProducto { get; set; } = "";

        /// <summary>
        /// Descripcion del tipo de producto.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Descripcion { get; set; } = "";

        /// <summary>
        /// Descripcion corta del tipo de producto.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(10, ErrorMessage = "La descripcion corta debe tener maximo 10 caracteres de longitud.")]
        public string DescripcionCorta { get; set; } = "";
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
