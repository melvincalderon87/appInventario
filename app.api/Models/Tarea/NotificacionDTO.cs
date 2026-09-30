using System.ComponentModel.DataAnnotations;

namespace app.Models.Tarea
{
    /// <summary>
    /// DTO que representa una notificacion asociada a una tarea.
    /// </summary>
    public class NotificacionDTO
    {
        public string? IdNotificacion { get; set; }

        public int CodNotificacion { get; set; }

        public int CodTarea { get; set; }

        public int Linea { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(100)]
        public string Descripcion { get; set; } = "";

        [StringLength(100)]
        public string Asunto { get; set; } = "";

        [StringLength(500)]
        public string Para { get; set; } = "";

        [StringLength(500)]
        public string Copia { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Texto { get; set; } = "";
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
