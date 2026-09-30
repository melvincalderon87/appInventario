namespace app.Models.Ventas
{
    /// <summary>Contrato de datos del modulo Venta.</summary>
    public class VentaDetalleDTO
    {
        public int Dia { get; set; }
        public decimal CantidadEstandar { get; set; }
        public decimal CantidadAmbiente { get; set; }
    }

    /// <summary>Contrato de datos del modulo Venta.</summary>

    public class VentaDTO
    {
        public int CodVenta { get; set; }
        public string IdVenta { get; set; } = "";
        public DateTime Periodo { get; set; }
        public string CodSuplidor { get; set; } = "";
        public string IdSuplidor { get; set; } = "";
        public string Suplidor { get; set; } = "";
        public string CodProducto { get; set; } = "";
        public string IdProducto { get; set; } = "";
        public string Producto { get; set; } = "";
        public string CodUsuario { get; set; } = "";
        public decimal Total { get; set; }
        public List<VentaDetalleDTO> Detalles { get; set; } = new List<VentaDetalleDTO>();
    }
}
