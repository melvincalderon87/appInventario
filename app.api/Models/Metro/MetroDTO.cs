using System.ComponentModel.DataAnnotations;

namespace app.Models.Metro
{
    /// <summary>
    /// DTO que representa un metro del sistema.
    /// </summary>
    public class MetroDTO
    {
        /// <summary>
        /// Identificador del metro en formato encriptado.
        /// </summary>
        public string? IdMetro { get; set; }

        /// <summary>
        /// Codigo alfanumerico del metro.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de metro debe tener maximo 20 caracteres de longitud.")]
        public string CodMetro { get; set; } = "";

        /// <summary>
        /// Codigo de la bahia relacionada.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de bahia debe tener maximo 20 caracteres de longitud.")]
        public string CodBahia { get; set; } = "";

        public string? IdBahia { get; set; }
        public string Bahia { get; set; } = "";

        /// <summary>
        /// Codigo del brazo relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de brazo debe tener maximo 20 caracteres de longitud.")]
        public string CodBrazo { get; set; } = "";

        public string? IdBrazo { get; set; }
        public string Brazo { get; set; } = "";

        /// <summary>
        /// Codigo del producto relacionado almacenado como texto.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de producto debe tener maximo 20 caracteres de longitud.")]
        public string CodProducto { get; set; } = "";

        public string? IdProducto { get; set; }
        public string Producto { get; set; } = "";

        /// <summary>
        /// Nombre del metro.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(200, ErrorMessage = "El metro debe tener maximo 200 caracteres de longitud.")]
        public string Metro { get; set; } = "";

        /// <summary>
        /// Tipo de metro.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(50, ErrorMessage = "El tipo de metro debe tener maximo 50 caracteres de longitud.")]
        public string TipoMetro { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(200, ErrorMessage = "El modelo debe tener maximo 200 caracteres de longitud.")]
        public string Modelo { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(200, ErrorMessage = "La serie debe tener maximo 200 caracteres de longitud.")]
        public string Serie { get; set; } = "";

        [StringLength(250, ErrorMessage = "El comentario debe tener maximo 250 caracteres de longitud.")]
        public string Comentario { get; set; } = "";

        public bool Estatus { get; set; } = true;
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
