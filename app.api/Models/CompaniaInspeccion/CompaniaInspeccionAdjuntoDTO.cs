using System.ComponentModel.DataAnnotations;

namespace app.Models.CompaniaInspeccion
{
    /// <summary>Contrato de datos del modulo CompaniaInspeccion.</summary>
    public class CompaniaInspeccionAdjuntoDTO
    {
        public int CodCompaniaInspeccionAdjunto { get; set; }

        public int CodCompaniaInspeccion { get; set; }

        public int CodCompaniaInspeccionArchivo
        {
            get => CodCompaniaInspeccion;
            set => CodCompaniaInspeccion = value;
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
