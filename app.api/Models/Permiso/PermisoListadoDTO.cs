namespace app.Models.Permiso
{
    /// <summary>Contrato de datos del modulo Permiso.</summary>
    public class PermisoListadoDTO
    {
        public string IdRol { get; set; } = "";

        public string IdMenu { get; set; } = "";

        public int CodRol { get; set; }

        public string RolDescripcion { get; set; } = "";

        public int CodMenu { get; set; }

        public string MenuDescripcion { get; set; } = "";

        public string Listado { get; set; } = "";

        public string Agregar { get; set; } = "";

        public string Editar { get; set; } = "";

        public string Eliminar { get; set; } = "";

        public string Visualizar { get; set; } = "";

        public string Imprimir { get; set; } = "";

        public string Reporte { get; set; } = "";

        public string Exportar { get; set; } = "";

        public string Aprobar { get; set; } = "";
        public string Log { get; set; } = "";

        public string Otro { get; set; } = "";

        public string Menu { get; set; } = "";
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
