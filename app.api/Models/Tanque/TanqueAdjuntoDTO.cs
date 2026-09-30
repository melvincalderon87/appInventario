using System.ComponentModel.DataAnnotations;

namespace app.Models.Tanque
{
    /// <summary>Contrato de datos del modulo Tanque.</summary>
    public class TanqueAdjuntoDTO
    {
        public int CodTanqueAdjunto { get; set; }

        public string CodTanque { get; set; } = "";

        public string CodTanqueArchivo
        {
            get => CodTanque;
            set => CodTanque = value;
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
