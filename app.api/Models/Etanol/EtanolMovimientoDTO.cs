namespace app.Models.Etanol;

/// <summary>Contrato de datos del modulo Etanol.</summary>

public class EtanolMovimientoDTO
{
    public int Codigo { get; set; }
    public DateTime? Fecha { get; set; }
    public string CodSuplidor { get; set; } = "";
    public string CodSuplidorOrigen { get; set; } = "";
    public string CodSuplidorDestino { get; set; } = "";
    public string CodProducto { get; set; } = "";
    public int CodBarco { get; set; }
    public decimal CantidadEstandar { get; set; }
    public decimal CantidadAmbiente { get; set; }
    public string SiglasUnidad { get; set; } = "";
    public bool Estatus { get; set; } = true;
}
