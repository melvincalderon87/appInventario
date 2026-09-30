using System.ComponentModel.DataAnnotations;

namespace app.Models.IngresoBarco
{
    /// <summary>
    /// DTO que representa una fila del detalle de ingreso de barco.
    /// </summary>
    public class IngresoBarcoDetalleDTO
    {
        /// <summary>
        /// Correlativo numerico del ingreso.
        /// </summary>
        public int CodIngresoBarco { get; set; }

        /// <summary>
        /// Numero de linea del detalle.
        /// </summary>
        public int Linea { get; set; }

        /// <summary>
        /// Codigo del suplidor.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodSuplidor { get; set; }

        /// <summary>
        /// Identificador del suplidor en formato encriptado.
        /// </summary>
        public string? IdSuplidor { get; set; }

        /// <summary>
        /// Nombre del suplidor.
        /// </summary>
        public string Suplidor { get; set; } = "";

        /// <summary>
        /// Codigo del producto.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodProducto { get; set; }

        /// <summary>
        /// Identificador del producto en formato encriptado.
        /// </summary>
        public string? IdProducto { get; set; }

        /// <summary>
        /// Nombre del producto.
        /// </summary>
        public string Producto { get; set; } = "";

        /// <summary>
        /// Cantidad en estandar.
        /// </summary>
        public decimal CantidadEstandar { get; set; }

        /// <summary>
        /// Cantidad en ambiente. Se calculara cuando se defina la formula.
        /// </summary>
        public decimal CantidadAmbiente { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public string CodigoInterno { get; set; } = "";
        public string Barco { get; set; } = "";
        public int Version { get; set; }
        public bool Estatus { get; set; } = true;
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
