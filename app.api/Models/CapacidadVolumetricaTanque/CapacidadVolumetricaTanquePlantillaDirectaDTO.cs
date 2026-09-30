namespace app.Models.CapacidadVolumetricaTanque
{
    /// <summary>
    /// Plantilla de carga directa al encabezado y detalle final de capacidad volumetrica.
    /// </summary>
    public class CapacidadVolumetricaTanquePlantillaDirectaDTO
    {
        public string? IdTanque { get; set; }
        public int CodCompaniaInspeccion { get; set; }
        public DateTime? FechaCalibracion { get; set; }
        public string Comentarios { get; set; } = "";
        public List<CapacidadVolumetricaTanqueDetalleDTO> Detalles { get; set; } = new List<CapacidadVolumetricaTanqueDetalleDTO>();
    }
}
