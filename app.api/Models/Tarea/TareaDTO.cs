using System.ComponentModel.DataAnnotations;

namespace app.Models.Tarea
{
    /// <summary>
    /// DTO que representa una tarea del sistema con sus notificaciones.
    /// </summary>
    public class TareaDTO
    {
        public string? IdTarea { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodTarea { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(250)]
        public string Descripcion { get; set; } = "";

        [StringLength(100)]
        public string Tiempo { get; set; } = "";

        public bool Estatus { get; set; } = true;

        public int NotificacionCantidad { get; set; }

        public List<NotificacionDTO> Notificaciones { get; set; } = new List<NotificacionDTO>();

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
    }
}
