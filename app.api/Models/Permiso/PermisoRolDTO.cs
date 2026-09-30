namespace app.Models.Permiso
{
    /// <summary>Contrato de datos del modulo Permiso.</summary>
    public class PermisoRolDTO
    {
        public string IdRol { get; set; } = "";

        public int CodRol { get; set; }

        public string RolDescripcion { get; set; } = "";

        public int CodMenu { get; set; }

        public string IdMenu { get; set; } = "";

        public string MenuDescripcion { get; set; } = "";

        public int CodTipoPermiso { get; set; }

        public string TipoPermisoDescripcion { get; set; } = "";

        public bool Asignado { get; set; }
        public int Version { get; set; }
        public bool Estatus { get; set; } = true;
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
