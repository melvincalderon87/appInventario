using System.ComponentModel.DataAnnotations;

namespace app.Models.IngresoBarco
{
    /// <summary>
    /// DTO que representa un ingreso de barco.
    /// </summary>
    public class IngresoBarcoDTO
    {
        /// <summary>
        /// Identificador del ingreso en formato encriptado.
        /// </summary>
        public string? IdIngresoBarco { get; set; }

        /// <summary>
        /// Correlativo numerico del ingreso.
        /// </summary>
        public int CodIngresoBarco { get; set; }

        /// <summary>
        /// Codigo del barco.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodBarco { get; set; }

        /// <summary>
        /// Identificador del barco en formato encriptado.
        /// </summary>
        public string? IdBarco { get; set; }

        /// <summary>
        /// Nombre del barco.
        /// </summary>
        public string Barco { get; set; } = "";

        /// <summary>
        /// Fecha del ingreso del barco.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? FechaIngreso { get; set; }

        /// <summary>
        /// Codigo interno del ingreso.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string CodigoInterno { get; set; } = "";

        /// <summary>
        /// Correlativo OTSA de referencia libre.
        /// </summary>
        public string CorrelativoOTSA { get; set; } = "";

        /// <summary>
        /// Filas del ingreso de barco.
        /// </summary>
        public List<IngresoBarcoDetalleDTO> Detalles { get; set; } = new List<IngresoBarcoDetalleDTO>();

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
