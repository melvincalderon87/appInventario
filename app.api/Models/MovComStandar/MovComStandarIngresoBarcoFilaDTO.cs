namespace app.Models.MovComStandar
{
    /// <summary>Contrato de datos del modulo MovComStandar.</summary>
    public class MovComStandarIngresoBarcoFilaDTO
    {
        public int CodIngresoBarco { get; set; }
        public DateTime FechaIngreso { get; set; }
        public string Barco { get; set; } = "";
        public int CodSuplidor { get; set; }
        public string Suplidor { get; set; } = "";
        public int CodProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal CantidadAmbiente { get; set; }
        public decimal CantidadEstandar { get; set; }
    }
}
