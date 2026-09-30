using System.ComponentModel.DataAnnotations;

namespace app.Models.MedicionTanqueTierra
{
    /// <summary>
    /// DTO que representa una medicion de tanque en tierra.
    /// </summary>
    public class MedicionTanqueTierraDTO
    {
        public string? IdMedicionTanqueTierra { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodMedicionTanqueTierra { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? Fecha { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodBarco { get; set; }

        public string? IdBarco { get; set; }
        public string Barco { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodSuplidor { get; set; }

        public string? IdSuplidor { get; set; }
        public string Suplidor { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodProducto { get; set; }

        public string? IdProducto { get; set; }
        public string Producto { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodCompaniaInspeccion { get; set; }

        public string? IdCompaniaInspeccion { get; set; }
        public string CompaniaInspeccion { get; set; } = "";

        public int DetalleCantidad { get; set; }
        public decimal VolumenEstandarBrutoTotal { get; set; }
        public List<MedicionTanqueTierraDetalleDTO> Detalles { get; set; } = new List<MedicionTanqueTierraDetalleDTO>();

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

    /// <summary>
    /// DTO que representa una fila de detalle de medicion de tanque en tierra.
    /// </summary>
    public class MedicionTanqueTierraDetalleDTO
    {
        public string? IdMedicionTanqueTierraDetalle { get; set; }
        public int CodMedicionTanqueTierraDetalle { get; set; }
        public int CodMedicionTanqueTierra { get; set; }
        public string? IdMedicionTanqueTierra { get; set; }
        public int Linea { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El campo no puede exceder 20 caracteres")]
        public string CodTanque { get; set; } = "";

        public string? IdTanque { get; set; }
        public string Tanque { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Tipo { get; set; } = "";

        [Required(ErrorMessage = "Campo Obligatorio")]
        public DateTime? Fecha { get; set; }

        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Hora { get; set; } = "";

        public int Pies { get; set; }
        public int Pulgadas { get; set; }
        public int Dieciseisavos { get; set; }
        public decimal Volumen { get; set; }
        public decimal CorreccionTecho { get; set; }
        public int MedidaAguaPies { get; set; }
        public int MedidaAguaPulgadas { get; set; }
        public decimal VolumenAguaLibre { get; set; }
        public decimal VolumenBrutoObservado { get; set; }
        public decimal Temperatura { get; set; }
        public decimal Api { get; set; }
        public decimal Factor { get; set; }
        public decimal VolumenEstandarBruto { get; set; }

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
