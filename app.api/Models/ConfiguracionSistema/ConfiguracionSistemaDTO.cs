namespace app.Models.ConfiguracionSistema
{
    /// <summary>Contrato de datos del modulo ConfiguracionSistema.</summary>
    public class ConfiguracionSistemaDTO
    {
        public ConfiguracionSistemaEmpresaDTO Empresa { get; set; } = new ConfiguracionSistemaEmpresaDTO();
        public ConfiguracionSistemaFondoDTO Fondo { get; set; } = new ConfiguracionSistemaFondoDTO();
    }
}
