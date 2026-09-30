namespace app.Models.EntradasProducto
{
    /// <summary>Contrato de datos del modulo EntradasProducto.</summary>
    public class EntradasProductoDTO
    {
        public string? IdEntradaProducto { get; set; }
        public int CodEntradaProducto { get; set; }
        public DateTime? Fecha { get; set; }
        public int CodSuplidor { get; set; }
        public string? IdSuplidor { get; set; }
        public string Suplidor { get; set; } = "";
        public int CodProducto { get; set; }
        public string? IdProducto { get; set; }
        public string Producto { get; set; } = "";
        public decimal CantidadEstandar { get; set; }
        public decimal CantidadAmbiente { get; set; }
        public string SiglasUnidad { get; set; } = "";
        public int Version { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
