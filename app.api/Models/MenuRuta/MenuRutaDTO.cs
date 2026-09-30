namespace app.Models.MenuRuta
{
    /// <summary>Contrato de datos del modulo MenuRuta.</summary>
    public class MenuRutaDTO
    {
        public string Ruta { get; set; } = "";
        public int CodMenu { get; set; }
        public string MenuDescripcion { get; set; } = "";
        public int CodTipoPermiso { get; set; }
        public string TipoPermisoDescripcion { get; set; } = "";
        public bool Estatus { get; set; }
        public int Version { get; set; }
        public string? CodUsuarioCreacion { get; set; }
        public string? IdUsuarioCreacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public string? CodUsuarioActualizacion { get; set; }
        public string? IdUsuarioActualizacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
