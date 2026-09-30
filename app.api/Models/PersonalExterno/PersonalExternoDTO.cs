using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace app.Models.PersonalExterno
{
    /// <summary>Contrato de datos del modulo PersonalExterno.</summary>
    public class PersonalExternoDTO
    {
        public string? IdPersonalExterno { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodPersonalExterno { get; set; }

        public string? IdCompaniaInspeccion { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCompaniaInspeccion { get; set; }

        public string CompaniaInspeccion { get; set; } = "";
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
        public int AdjuntoCantidad { get; set; }
        public List<PersonalExternoAdjuntoDTO> Adjuntos { get; set; } = new List<PersonalExternoAdjuntoDTO>();
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
