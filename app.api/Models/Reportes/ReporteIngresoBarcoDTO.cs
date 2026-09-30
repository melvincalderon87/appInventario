namespace app.Models.Reportes
{
    /// <summary>Contrato de datos del modulo Reportes.</summary>
    public class ReporteIngresoBarcoDTO
    {
        /// <summary>Fecha de ingreso del barco.</summary>
        public DateTime FechaIngreso { get; set; }
        /// <summary>Codigo interno del ingreso.</summary>
        public string CodigoIngreso { get; set; } = "";
        /// <summary>Nombre del barco.</summary>
        public string Barco { get; set; } = "";
        /// <summary>Codigo interno consignado en el ingreso.</summary>
        public string CodigoInterno { get; set; } = "";
        /// <summary>Suplidor del producto ingresado.</summary>
        public string Suplidor { get; set; } = "";
        /// <summary>Producto ingresado.</summary>
        public string Producto { get; set; } = "";
        /// <summary>Cantidad Ambiente o Standard, segun el filtro solicitado.</summary>
        public decimal CantidadCargada { get; set; }
    }
}
