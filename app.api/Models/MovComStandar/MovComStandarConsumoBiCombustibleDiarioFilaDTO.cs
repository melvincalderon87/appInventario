namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarConsumoBiCombustibleDiarioFilaDTO
    {
        public DateTime Fecha { get; set; }
        public int CodSuplidor { get; set; }
        public string Suplidor { get; set; } = "";
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal Consumos { get; set; }
    }
}
