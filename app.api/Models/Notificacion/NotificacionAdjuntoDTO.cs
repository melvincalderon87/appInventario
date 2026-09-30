using System.ComponentModel.DataAnnotations;

namespace app.Models.Notificacion
{
    /// <summary>Contrato de datos del modulo Notificacion.</summary>
    public class NotificacionAdjuntoDTO
    {
        public int CodNotificacionAdjunto { get; set; }

        public int CodNotificacion { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(260)]
        public string NombreArchivo { get; set; } = "";

        [StringLength(150)]
        public string TipoContenido { get; set; } = "application/octet-stream";

        public long TamanoBytes { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string ContenidoBase64 { get; set; } = "";
    }
}
