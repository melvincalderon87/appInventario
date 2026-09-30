using System.ComponentModel.DataAnnotations;

namespace app.Models.Bahia
{
    /// <summary>Contrato de datos del modulo Bahia.</summary>
    public class BahiaAdjuntoDTO
    {
        public int CodBahiaAdjunto { get; set; }

        public string CodBahia { get; set; } = "";

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
