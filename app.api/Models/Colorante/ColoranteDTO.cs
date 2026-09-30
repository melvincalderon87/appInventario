using System.ComponentModel.DataAnnotations;

namespace app.Models.Colorante
{
    /// <summary>
    /// DTO que representa un movimiento de inventario de colorante.
    /// </summary>
    public class ColoranteDTO
    {
        /// <summary>
        /// Identificador del movimiento en formato encriptado.
        /// </summary>
        public string? IdColorante { get; set; }

        /// <summary>
        /// Codigo del movimiento.
        /// </summary>
        public int CodDocumento { get; set; }

        /// <summary>
        /// Codigo del producto colorante relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string CodProducto { get; set; } = "";

        /// <summary>
        /// Identificador del producto en formato encriptado.
        /// </summary>
        public string? IdProducto { get; set; }

        /// <summary>
        /// Nombre del producto colorante.
        /// </summary>
        public string Producto { get; set; } = "";

        /// <summary>
        /// Tipo de producto relacionado.
        /// </summary>
        public string TipoProducto { get; set; } = "";

        /// <summary>
        /// Descripcion corta del producto relacionado.
        /// </summary>
        public string DescripcionCorta { get; set; } = "";

        /// <summary>
        /// Fecha del movimiento.
        /// </summary>
        public DateTime? Fecha { get; set; }

        /// <summary>
        /// Tipo de movimiento: INGRESO o SALIDA.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string TipoMovimiento { get; set; } = "";

        /// <summary>
        /// Codigo del barco relacionado con la salida de colorante por barco.
        /// </summary>
        public int CodBarco { get; set; }

        /// <summary>
        /// Identificador del barco en formato encriptado.
        /// </summary>
        public string? IdBarco { get; set; }

        /// <summary>
        /// Nombre del barco relacionado.
        /// </summary>
        public string Barco { get; set; } = "";

        /// <summary>
        /// Codigo del suplidor relacionado con la salida de colorante por barco.
        /// </summary>
        public int CodSuplidor { get; set; }

        /// <summary>
        /// Identificador del suplidor en formato encriptado.
        /// </summary>
        public string? IdSuplidor { get; set; }

        /// <summary>
        /// Nombre del suplidor relacionado.
        /// </summary>
        public string Suplidor { get; set; } = "";

        /// <summary>
        /// Cantidad del movimiento.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public decimal Cantidad { get; set; }

        /// <summary>
        /// Comentarios del movimiento.
        /// </summary>
        [StringLength(250, ErrorMessage = "El campo comentarios debe tener máximo 250 caracteres de longitud.")]
        public string Comentarios { get; set; } = "";

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
