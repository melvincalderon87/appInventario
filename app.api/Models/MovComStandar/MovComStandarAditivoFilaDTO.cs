namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarAditivoFilaDTO
    {
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal SaldoInicial { get; set; }
        public decimal OtrosIngresos { get; set; }
        public decimal OtrasSalidas { get; set; }
        public decimal ConsumosBi { get; set; }
        public decimal FinalFisicoTanques { get; set; }
    }
}
