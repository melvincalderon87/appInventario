namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarConsumoBiFilaDTO
    {
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal Consumos { get; set; }
    }
}
