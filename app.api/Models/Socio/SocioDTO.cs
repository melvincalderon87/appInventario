using System.ComponentModel.DataAnnotations;

namespace app.Models.Suplidor
{
    /// <summary>
    /// DTO que representa un suplidor del sistema.
    /// </summary>
    public class SuplidorDTO
    {
        /// <summary>
        /// Identificador del suplidor en formato encriptado.
        /// </summary>
        public string? IdSuplidor { get; set; }

        /// <summary>
        /// Codigo del suplidor.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de suplidor debe tener maximo 20 caracteres.")]
        public string CodSuplidor { get; set; } = "";

        /// <summary>
        /// Codigo del socio asociado al suplidor.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de socio debe tener maximo 20 caracteres.")]
        public string CodSocio { get; set; } = "";

        /// <summary>
        /// Identificador del socio asociado al suplidor en formato encriptado.
        /// </summary>
        public string? IdSocio { get; set; }

        /// <summary>
        /// Nombre del socio asociado al suplidor.
        /// </summary>
        public string Socio { get; set; } = "";

        /// <summary>
        /// Nombre del suplidor.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Suplidor { get; set; } = "";

        /// <summary>
        /// Nombre corto del suplidor.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(10, ErrorMessage = "El nombre corto debe tener maximo 10 caracteres de longitud.")]
        public string SuplidorNombreCorto { get; set; } = "";

        /// <summary>
        /// Indica si el suplidor se encuentra activo.
        /// </summary>
        public bool Estatus { get; set; } = true;

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
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}

public class SuplidorProductoDistribucionDTO
{
    public string CodProducto { get; set; } = "";
    public string Producto { get; set; } = "";
    public decimal PorcentajeDistribucion { get; set; }
}
