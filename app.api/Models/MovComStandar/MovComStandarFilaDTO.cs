namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarFilaDTO
    {
        public int CodSuplidor { get; set; }
        public string Suplidor { get; set; } = "";
        public string CodSocio { get; set; } = "";
        public string Socio { get; set; } = "";
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal Inicial { get; set; }
        public decimal Recibos { get; set; }
        public decimal Despachos { get; set; }
        public decimal OtrasEntradas { get; set; }
        public decimal OtrasSalidas { get; set; }
        public decimal FinalTeorico { get; set; }
        public decimal FisicoTanques { get; set; }
        public decimal TuberiaInterna { get; set; }
    }
}
