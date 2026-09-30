using System.ComponentModel.DataAnnotations;

namespace app.Models.Salidas
{
    /// <summary>
    /// DTO que representa una salida de producto por suplidor.
    /// </summary>
    public class SalidasDTO
    {
        /// <summary>
        /// Identificador de la salida en formato encriptado.
        /// </summary>
        public string? IdSalida { get; set; }

        /// <summary>
        /// Correlativo numerico de la salida.
        /// </summary>
        public int CodSalida { get; set; }

        /// <summary>
        /// Fecha de la salida.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? Fecha { get; set; }

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
        [Required(ErrorMessage = "Campo Obligatorio")]
        public decimal CantidadEstandar { get; set; }

        /// <summary>
        /// Cantidad en ambiente.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public decimal CantidadAmbiente { get; set; }

        public string SiglasUnidad { get; set; } = "";

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
        public bool Estatus { get; set; } = true;
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
