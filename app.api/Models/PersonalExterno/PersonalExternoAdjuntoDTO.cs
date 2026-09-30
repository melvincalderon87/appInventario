using System.ComponentModel.DataAnnotations;

namespace app.Models.PersonalExterno
{
    /// <summary>Contrato de datos del modulo PersonalExterno.</summary>
    public class PersonalExternoAdjuntoDTO
    {
        public int CodPersonalExternoAdjunto { get; set; }

        public int CodPersonalExterno { get; set; }

        public int CodPersonalExternoArchivo
        {
            get => CodPersonalExterno;
            set => CodPersonalExterno = value;
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
