using System.ComponentModel.DataAnnotations;

namespace app.Models.Tuberia
{
    /// <summary>Contrato de datos del modulo Tuberia.</summary>
    public class TuberiaAdjuntoDTO
    {
        public int CodTuberiaAdjunto { get; set; }

        public string CodTuberia { get; set; } = "";

        public string CodTuberiaArchivo
        {
            get => CodTuberia;
            set => CodTuberia = value;
        }

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(260)]
        public string NombreArchivo { get; set; } = "";

        [StringLength(150)]
        public string TipoContenido { get; set; } = "application/octet-stream";

        public long TamanoBytes { get; set; }
        public string RutaArchivo { get; set; } = "";
        public string ContenidoBase64 { get; set; } = "";
    }
}
