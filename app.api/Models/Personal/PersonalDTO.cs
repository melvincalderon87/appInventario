using System.ComponentModel.DataAnnotations;

namespace app.Models.Personal
{
    /// <summary>Contrato de datos del modulo Personal.</summary>
    public class PersonalDTO
    {
        public string? IdPersonal { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodPersonal { get; set; }

        public string CodTecnico { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Nombre { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Puesto { get; set; } = "";

        public bool EsTecnico { get; set; }
        public string FotoNombreArchivo { get; set; } = "";
        public string FotoTipoContenido { get; set; } = "";
        public long FotoTamanoBytes { get; set; }
        public string FotoRutaArchivo { get; set; } = "";
        public string FotoContenidoBase64 { get; set; } = "";
        public bool FotoEliminar { get; set; }
        public bool Estatus { get; set; } = true;
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
