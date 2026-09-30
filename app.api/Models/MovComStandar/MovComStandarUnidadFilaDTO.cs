namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarUnidadFilaDTO
    {
        public int Codigo { get; set; }
        public DateTime Fecha { get; set; }
        public string Tipo { get; set; } = "";
        public string SiglasUnidad { get; set; } = "";
        public int CodSuplidor { get; set; }
        public string Suplidor { get; set; } = "";
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal CantidadAmbiente { get; set; }
        public decimal CantidadEstandar { get; set; }
        public decimal CantidadBoletas { get; set; }
    }
}
