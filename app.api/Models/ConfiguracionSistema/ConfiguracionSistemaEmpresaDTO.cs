namespace app.Models.ConfiguracionSistema
{
    /// <summary>Contrato de datos del modulo ConfiguracionSistema.</summary>
    public class ConfiguracionSistemaEmpresaDTO
    {
        public string? IdConfiguracionSistema { get; set; }
        public int CodConfiguracionSistema { get; set; } = 1;
        public string NombreComercial { get; set; } = "";
        public string NombreFiscal { get; set; } = "";
        public string Nit { get; set; } = "";
        public string Direccion { get; set; } = "";
        public string Telefono { get; set; } = "";
        public string PaginaWeb { get; set; } = "";
        public string LogoNombreArchivo { get; set; } = "";
        public string LogoTipoContenido { get; set; } = "";
        public long LogoTamanoBytes { get; set; }
        public string LogoRutaArchivo { get; set; } = "";
        public string LogoContenidoBase64 { get; set; } = "";
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
