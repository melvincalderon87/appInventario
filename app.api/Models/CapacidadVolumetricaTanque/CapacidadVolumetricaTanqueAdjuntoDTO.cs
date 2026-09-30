using System.ComponentModel.DataAnnotations;

namespace app.Models.CapacidadVolumetricaTanque
{
    /// <summary>Contrato de datos del modulo CapacidadVolumetricaTanque.</summary>
    public class CapacidadVolumetricaTanqueAdjuntoDTO
    {
        public int CodCapacidadVolumetricaTanqueAdjunto { get; set; }

        public int CodCapacidadVolumetricaTanque { get; set; }

        public int CodCapacidadVolumetricaTanqueArchivo
        {
            get => CodCapacidadVolumetricaTanque;
            set => CodCapacidadVolumetricaTanque = value;
        }

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(260)]
        public string NombreArchivo { get; set; } = "";

        [StringLength(150)]
        public string TipoContenido { get; set; } = "application/pdf";

        public long TamanoBytes { get; set; }

        public string RutaArchivo { get; set; } = "";

        public string ContenidoBase64 { get; set; } = "";
    }
}
