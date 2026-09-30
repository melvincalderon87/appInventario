namespace app.Models.SaldoInicial
{
    /// <summary>Contrato de datos del modulo SaldoInicial.</summary>
    public class SaldoInicialDTO
    {
        public string? IdSaldoInicial { get; set; }
        public int CodSaldoInicial { get; set; }
        public string Tipo { get; set; } = "";
        public int CodSuplidor { get; set; }
        public string Suplidor { get; set; } = "";
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal CantidadEstandar { get; set; }
        public decimal CantidadAmbiente { get; set; }
        public decimal Cantidad { get; set; }
        public DateTime? Fecha { get; set; }
        public DateTime? FechaCreacion { get; set; }
    }
}
