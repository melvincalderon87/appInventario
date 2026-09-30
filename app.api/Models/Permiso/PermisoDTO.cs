using app.Models.Menu;
using app.Models.Roles;
using System.ComponentModel.DataAnnotations;

namespace app.Models.Permiso
{
    /// <summary>Contrato de datos del modulo Permiso.</summary>
    public class PermisoDTO
    {
        [Required(ErrorMessage = "Campo Obligatorio")]
        [Display(Name = "Rol")]
        public int CodRol { get; set; }

        public RolDTO Rol { get; set; } = new RolDTO();

        [Required(ErrorMessage = "Campo Obligatorio")]
        [Display(Name = "Menu")]
        public int CodMenu { get; set; }

        public MenuDTO Menu { get; set; } = new MenuDTO();

        [Required(ErrorMessage = "Campo Obligatorio")]
        [Display(Name = "Tipo de Permiso")]
        public int CodTipoPermiso { get; set; }

        public int? Version { get; set; }

        public string? CodUsuarioCreacion { get; set; }

        public string? IdUsuarioCreacion { get; set; }

        public DateTime? FechaCreacion { get; set; }

        public string? CodUsuarioActualizacion { get; set; }

        public string? IdUsuarioActualizacion { get; set; }

        public DateTime? FechaActualizacion { get; set; }
        public bool Estatus { get; set; } = true;
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
