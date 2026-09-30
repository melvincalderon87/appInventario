namespace app.Models.ConfiguracionSistema
{
    /// <summary>Contrato de datos del modulo ConfiguracionSistema.</summary>
    public class ConfiguracionSistemaFondoDTO
    {
        public string? IdConfiguracionSistema { get; set; }
        public int CodConfiguracionSistema { get; set; } = 1;
        public string FondoNombreArchivo { get; set; } = "";
        public string FondoTipoContenido { get; set; } = "";
        public long FondoTamanoBytes { get; set; }
        public string FondoRutaArchivo { get; set; } = "";
        public string FondoContenidoBase64 { get; set; } = "";
        public int Version { get; set; }
        public string? CodUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
