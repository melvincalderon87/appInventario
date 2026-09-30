namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarTanqueFilaDTO
    {
        public DateTime Fecha { get; set; }
        public string CodTanque { get; set; } = "";
        public string Tanque { get; set; } = "";
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public int Pies { get; set; }
        public int Pulgadas { get; set; }
        public int Dieciseisavos { get; set; }
        public int MedidaAguaPies { get; set; }
        public int MedidaAguaPulgadas { get; set; }
        public decimal Volumen { get; set; }
        public decimal VolumenAgua { get; set; }
        public decimal CorreccionTecho { get; set; }
        public decimal Temperatura { get; set; }
        public decimal Api { get; set; }
        public decimal Factor { get; set; }
        public decimal VolumenAmbiente { get; set; }
        public decimal VolumenEstandar { get; set; }
        public decimal CapacidadMaxima { get; set; }
        public decimal CapacidadDisponible { get; set; }
    }
}
