namespace app.Models.Usuarios
{
    /// <summary>Contrato de datos del modulo Usuario.</summary>
    public class UsuarioExportacionDTO
    {
        public string CodUsuario { get; set; } = "";
        public string Nombre { get; set; } = "";
        public string Correo { get; set; } = "";
        public bool Estatus { get; set; }
        public string TipoUsuario { get; set; } = "";
        public string Rol { get; set; } = "";
        public string Idioma { get; set; } = "";
        public string Theme { get; set; } = "";
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
