using System.ComponentModel.DataAnnotations;

namespace app.Models.Aditivo
{
    /// <summary>
    /// DTO que representa un movimiento de aditivo.
    /// </summary>
    public class AditivoDTO
    {
        public string? IdAditivo { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodDocumento { get; set; }

        public int CodSuplidor { get; set; }
        public string? IdSuplidor { get; set; }
        public string Suplidor { get; set; } = "";

        public int CodProducto { get; set; }
        public string? IdProducto { get; set; }
        public string Producto { get; set; } = "";

        public string CodTanque { get; set; } = "";
        public string? IdTanque { get; set; }
        public string Tanque { get; set; } = "";

        public DateTime? Fecha { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string TipoMovimiento { get; set; } = "";

        /// <summary>
        /// Cantidad del movimiento en galones.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public decimal Cantidad { get; set; }

        [StringLength(250, ErrorMessage = "El comentario debe tener maximo 250 caracteres de longitud.")]
        public string Comentario { get; set; } = "";

        public int Version { get; set; }
        public string? CodUsuarioCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
