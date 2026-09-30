namespace app.Models.Reportes
{
    /// <summary>Contrato de datos del modulo Reportes.</summary>
    public class ReporteCargaDTO
    {
        /// <summary>Fecha de carga registrada en el folio BI.</summary>
        public DateTime FechaCarga { get; set; }
        /// <summary>Folio BI que identifica la carga.</summary>
        public string Folio { get; set; } = "";
        /// <summary>Codigo del cliente.</summary>
        public string CodCliente { get; set; } = "";
        /// <summary>Nombre del cliente.</summary>
        public string Cliente { get; set; } = "";
        /// <summary>Unidad de transporte.</summary>
        public string Unidad { get; set; } = "";
        /// <summary>Piloto asignado a la unidad.</summary>
        public string Piloto { get; set; } = "";
        public string ProductoTms { get; set; } = "";
        /// <summary>Factor calculado de la carga.</summary>
        public decimal Factor { get; set; }
        /// <summary>Factor de correccion de volumen.</summary>
        public decimal Vcf { get; set; }
        /// <summary>Cantidad del tipo de volumen solicitado.</summary>
        public decimal CantidadCargada { get; set; }
    }
}
