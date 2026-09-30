using System.ComponentModel.DataAnnotations;

namespace app.Models.Notificacion
{
    /// <summary>Contrato de datos del modulo Notificacion.</summary>
    public class NotificacionDTO
    {
        public string? IdNotificacion { get; set; }

        public int CodNotificacion { get; set; }

        public int? CodTarea { get; set; }

        public string? IdTarea { get; set; }

        public string TareaDescripcion { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(250)]
        public string Descripcion { get; set; } = "";

        [StringLength(500)]
        public string Asunto { get; set; } = "";

        public string Para { get; set; } = "";

        public string Copia { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Texto { get; set; } = "";

        public DateTime? FechaProgramada { get; set; }

        public int Estado { get; set; }

        public string EstadoDescripcion { get; set; } = "";

        public int Intentos { get; set; }

        public string Error { get; set; } = "";

        public DateTime? FechaEnviado { get; set; }

        public DateTime? FechaCreacion { get; set; }

        public bool Estatus { get; set; } = true;

        public int AdjuntoCantidad { get; set; }

        public List<NotificacionAdjuntoDTO> Adjuntos { get; set; } = new List<NotificacionAdjuntoDTO>();

        public int Version { get; set; }

        public string? CodUsuarioCreacion { get; set; }

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
