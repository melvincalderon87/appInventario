using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace app.Models.Tuberia
{
    /// <summary>
    /// DTO que representa una tuberia del sistema.
    /// </summary>
    public class TuberiaDTO
    {
        /// <summary>
        /// Identificador de la tuberia en formato encriptado.
        /// </summary>
        public string? IdTuberia { get; set; }

        /// <summary>
        /// Codigo alfanumerico de la tuberia.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de tuberia debe tener maximo 20 caracteres de longitud.")]
        public string CodTuberia { get; set; } = "";

        /// <summary>
        /// Codigo del tanque relacionado. Puede estar vacio cuando no aplica.
        /// </summary>
        public string CodTanque { get; set; } = "";

        /// <summary>
        /// Identificador del tanque en formato encriptado.
        /// </summary>
        public string? IdTanque { get; set; }

        /// <summary>
        /// Descripcion del tanque relacionado.
        /// </summary>
        public string Tanque { get; set; } = "";

        /// <summary>
        /// Codigo alfanumerico del tipo de producto que mueve la tuberia.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de tipo de producto debe tener maximo 20 caracteres de longitud.")]
        public string CodTipoProducto { get; set; } = "";

        /// <summary>
        /// Codigo del producto relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string CodProducto { get; set; } = "";

        /// <summary>
        /// Identificador del tipo de producto en formato encriptado.
        /// </summary>
        public string? IdTipoProducto { get; set; }

        /// <summary>
        /// Descripcion del tipo de producto relacionado.
        /// </summary>
        public string TipoProducto { get; set; } = "";

        /// <summary>
        /// Identificador del producto en formato encriptado.
        /// </summary>
        public string? IdProducto { get; set; }

        /// <summary>
        /// Descripcion del producto relacionado.
        /// </summary>
        public string Producto { get; set; } = "";

        /// <summary>
        /// Ubicacion de la tuberia.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(250, ErrorMessage = "La ubicacion debe tener maximo 250 caracteres de longitud.")]
        public string Ubicacion { get; set; } = "";

        /// <summary>
        /// Tramo de linea.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(250, ErrorMessage = "El tramo de linea debe tener maximo 250 caracteres de longitud.")]
        public string TramoLinea { get; set; } = "";

        /// <summary>
        /// Diametro inicial de la tuberia.
        /// </summary>
        public decimal DiametroInicio { get; set; }

        /// <summary>
        /// Diametro final de la tuberia.
        /// </summary>
        public decimal DiametroFinal { get; set; }

        /// <summary>
        /// Volumen de la tuberia.
        /// </summary>
        public decimal Volumen { get; set; }

        /// <summary>
        /// Fecha de certificacion de la tuberia.
        /// </summary>
        public DateTime? FechaCertificacion { get; set; }

        /// <summary>
        /// Codigo de la compania de inspeccion.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCompaniaInspeccion { get; set; }

        /// <summary>
        /// Identificador de la compania de inspeccion en formato encriptado.
        /// </summary>
        public string? IdCompaniaInspeccion { get; set; }

        /// <summary>
        /// Nombre comercial de la compania de inspeccion.
        /// </summary>
        public string CompaniaInspeccion { get; set; } = "";

        /// <summary>
        /// Tipo de movimiento de la tuberia: ENTRADA, SALIDA o NO APLICA.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string TipoMovimiento { get; set; } = "";

        /// <summary>
        /// Comentario de la tuberia.
        /// </summary>
        [StringLength(250, ErrorMessage = "El comentario debe tener maximo 250 caracteres de longitud.")]
        public string Comentario { get; set; } = "";

        /// <summary>
        /// Indica si la tuberia se encuentra activa.
        /// </summary>
        public bool Estatus { get; set; } = true;

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
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
        public int AdjuntoCantidad { get; set; }
        public List<TuberiaAdjuntoDTO> Adjuntos { get; set; } = new List<TuberiaAdjuntoDTO>();
    }

    public class TuberiaResumenProductoDTO
    {
        public string CodProducto { get; set; } = "";
        public string? IdProducto { get; set; }
        public string Producto { get; set; } = "";
        public int CantidadTuberias { get; set; }
        public decimal VolumenTotal { get; set; }
    }
}
