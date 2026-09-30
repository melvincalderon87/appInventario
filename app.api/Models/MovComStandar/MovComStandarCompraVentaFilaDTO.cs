namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarCompraVentaFilaDTO
    {
        public int Codigo { get; set; }
        public DateTime Fecha { get; set; }
        public int CodSuplidorOrigen { get; set; }
        public string SuplidorOrigen { get; set; } = "";
        public int CodSuplidorDestino { get; set; }
        public string SuplidorDestino { get; set; } = "";
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal CantidadAmbiente { get; set; }
        public decimal CantidadEstandar { get; set; }
    }
}
