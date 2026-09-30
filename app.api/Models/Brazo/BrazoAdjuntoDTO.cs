using System.ComponentModel.DataAnnotations;

namespace app.Models.Brazo
{
    /// <summary>Contrato de datos del modulo Brazo.</summary>
    public class BrazoAdjuntoDTO
    {
        public int CodBrazoAdjunto { get; set; }

        public string CodBrazo { get; set; } = "";

        public string CodBrazoArchivo
        {
            get => CodBrazo;
            set => CodBrazo = value;
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
