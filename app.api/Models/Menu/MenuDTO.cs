
namespace app.Models.Menu
{
    /// <summary>
    /// DTO que representa un menu de la aplicacion.
    /// </summary>
    public class MenuDTO
    {
        /// <summary>
        /// Identificador del menu en formato encriptado.
        /// </summary>
        public string IdMenu { get; set; }

        /// <summary>
        /// Codigo numerico del menu.
        /// </summary>
        public int CodMenu { get; set; }

        /// <summary>
        /// Descripcion o nombre visible del menu.
        /// </summary>
        public string Descripcion { get; set; }

        /// <summary>
        /// Ruta o enlace asociado al menu.
        /// </summary>
        public string Link { get; set; }

        /// <summary>
        /// Accion asociada al menu.
        /// </summary>
        public string Accion { get; set; }

        /// <summary>
        /// Icono asociado al menu.
        /// </summary>
        public string Icono { get; set; }

        /// <summary>
        /// Codigo del menu padre.
        /// </summary>
        public int Padre { get; set; }

        /// <summary>
        /// Orden de visualizacion del menu.
        /// </summary>
        public int Orden { get; set; }

        /// <summary>
        /// Indica si el menu esta activo.
        /// </summary>
        public bool Estatus { get; set; }

        /// <summary>
        /// Lista de submenus hijos.
        /// </summary>
        public List<MenuDTO> Children { get; set; } = new List<MenuDTO>();
        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int? Version { get; set; }

        /// <summary>
        /// Codigo del usuario que creo el registro.
        /// </summary>
        public string? CodUsuarioCreacion { get; set; }

        /// <summary>
        /// Identificador del usuario que creo el registro.
        /// </summary>
        public string? IdUsuarioCreacion { get; set; }

        /// <summary>
        /// Fecha de creacion del registro.
        /// </summary>
        public DateTime? FechaCreacion { get; set; }

        /// <summary>
        /// Codigo del usuario que actualizo el registro.
        /// </summary>
        public string? CodUsuarioActualizacion { get; set; }

        /// <summary>
        /// Identificador del usuario que actualizo el registro.
        /// </summary>
        public string? IdUsuarioActualizacion { get; set; }

        /// <summary>
        /// Fecha de ultima actualizacion del registro.
        /// </summary>
        public DateTime? FechaActualizacion { get; set; }
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
