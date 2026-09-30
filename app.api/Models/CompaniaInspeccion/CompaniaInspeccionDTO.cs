using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace app.Models.CompaniaInspeccion
{
    /// <summary>Contrato de datos del modulo CompaniaInspeccion.</summary>
    public class CompaniaInspeccionDTO
    {
        public string? IdCompaniaInspeccion { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCompaniaInspeccion { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string NombreComercial { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string NombreFiscal { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Nit { get; set; } = "";

        public bool Estatus { get; set; } = true;
        public int AdjuntoCantidad { get; set; }
        public List<CompaniaInspeccionAdjuntoDTO> Adjuntos { get; set; } = new List<CompaniaInspeccionAdjuntoDTO>();
        public int Version { get; set; }
        public string? CodUsuarioCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
