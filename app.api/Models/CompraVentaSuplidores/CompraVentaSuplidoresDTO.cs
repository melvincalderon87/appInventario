using System.ComponentModel.DataAnnotations;

namespace app.Models.CompraVentaSuplidores
{
    /// <summary>
    /// DTO que representa un traslado de producto entre suplidores.
    /// </summary>
    public class CompraVentaSuplidoresDTO
    {
        /// <summary>
        /// Identificador del traslado en formato encriptado.
        /// </summary>
        public string? IdCompraVentaSuplidores { get; set; }

        /// <summary>
        /// Correlativo numerico del traslado.
        /// </summary>
        public int CodCompraVentaSuplidores { get; set; }

        /// <summary>
        /// Fecha del traslado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? Fecha { get; set; }

        /// <summary>
        /// Codigo del suplidor origen.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodSuplidorOrigen { get; set; }

        /// <summary>
        /// Identificador del suplidor origen en formato encriptado.
        /// </summary>
        public string? IdSuplidorOrigen { get; set; }

        /// <summary>
        /// Nombre del suplidor origen.
        /// </summary>
        public string SuplidorOrigen { get; set; } = "";

        /// <summary>
        /// Codigo del suplidor destino.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodSuplidorDestino { get; set; }

        /// <summary>
        /// Identificador del suplidor destino en formato encriptado.
        /// </summary>
        public string? IdSuplidorDestino { get; set; }

        /// <summary>
        /// Nombre del suplidor destino.
        /// </summary>
        public string SuplidorDestino { get; set; } = "";

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
        [Required(ErrorMessage = "Campo Obligatorio")]
        public decimal CantidadEstandar { get; set; }

        /// <summary>
        /// Cantidad en ambiente.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public decimal CantidadAmbiente { get; set; }

        /// <summary>
        /// Estado activo/inactivo del traslado.
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
        /// Fecha de creacion del registro.
        /// </summary>
        public DateTime? FechaCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
