namespace app.Models.CapacidadVolumetricaTanque
{
    /// <summary>Contrato de datos del modulo CapacidadVolumetricaTanque.</summary>
    public class CapacidadVolumetricaTanqueDetalle2DTO
    {
        public string? IdCapacidadVolumetricaTanqueDetalle2 { get; set; }
        public int CodCapacidadVolumetricaTanqueDetalle2 { get; set; }
        public int CodCapacidadVolumetricaTanque { get; set; }
        public string? IdCapacidadVolumetricaTanque { get; set; }
        public int Pies { get; set; }
        public int Pulgadas { get; set; }
        public decimal Volumen { get; set; }
        public int Version { get; set; }
        public string? CodUsuarioCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
