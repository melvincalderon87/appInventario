using System.ComponentModel.DataAnnotations;

namespace app.Models.Barco
{
    /// <summary>
    /// DTO que representa un barco del sistema.
    /// </summary>
    public class BarcoDTO
    {
        /// <summary>
        /// Identificador del barco en formato encriptado.
        /// </summary>
        public string? IdBarco { get; set; }

        /// <summary>
        /// Correlativo numerico del barco.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodBarco { get; set; }

        /// <summary>
        /// Nombre del barco.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Barco { get; set; } = "";

        /// <summary>
        /// Fecha prevista del barco.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? FechaPrevista { get; set; }

        /// <summary>
        /// Comentario del barco.
        /// </summary>
        public string Comentario { get; set; } = "";

        /// <summary>
        /// Cantidad total de las filas del barco.
        /// </summary>
        public decimal CantidadTotal { get; set; }

        /// <summary>
        /// Cantidad de filas del detalle.
        /// </summary>
        public int DetalleCantidad { get; set; }

        /// <summary>
        /// Filas de suplidores, productos y cantidades.
        /// </summary>
        public List<BarcoDetalleDTO> Detalles { get; set; } = new List<BarcoDetalleDTO>();

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
