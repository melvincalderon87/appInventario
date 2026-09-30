using System.ComponentModel.DataAnnotations;

namespace app.Models.VolumenTanque
{
    /// <summary>
    /// DTO para extraer volumen de un tanque desde la tabla de capacidad volumentrica.
    /// </summary>
    public class VolumenTanqueDTO
    {
        public string? IdVolumenTanque { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodDocumento { get; set; }

        public DateTime? Fecha { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de tanque debe tener maximo 20 caracteres.")]
        public string CodTanque { get; set; } = "";

        public string? IdTanque { get; set; }
        public string Tanque { get; set; } = "";
        public int Pies { get; set; }
        public int Pulgadas { get; set; }
        public int Dieciseisavos { get; set; }
        public decimal Volumen { get; set; }
        public int MedidaAguaPies { get; set; }
        public int MedidaAguaPulgadas { get; set; }
        public decimal VolumenAgua { get; set; }
        public decimal CorreccionTecho { get; set; }
        public decimal Temperatura { get; set; }
        public decimal Api { get; set; }
        public decimal Factor { get; set; }
        public decimal VolumenAmbiente { get; set; }
        public decimal VolumenEstandar { get; set; }
        public decimal CapacidadMaxima { get; set; }
        public decimal CapacidadDisponible { get; set; }
        public int Version { get; set; }
        public bool Estatus { get; set; } = true;
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
