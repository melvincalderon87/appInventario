using System.ComponentModel.DataAnnotations;

namespace app.Models.Tanque
{
    /// <summary>
    /// DTO que representa un tanque del sistema.
    /// </summary>
    public class TanqueDTO
    {
        /// <summary>
        /// Identificador del tanque en formato encriptado.
        /// </summary>
        public string? IdTanque { get; set; }

        /// <summary>
        /// Codigo alfanumerico del tanque.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(20, ErrorMessage = "El codigo de tanque debe tener maximo 20 caracteres de longitud.")]
        public string CodTanque { get; set; } = "";

        /// <summary>
        /// Codigo del producto relacionado.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public int CodProducto { get; set; }

        /// <summary>
        /// Identificador del producto en formato encriptado.
        /// </summary>
        public string? IdProducto { get; set; }

        /// <summary>
        /// Descripcion del producto relacionado.
        /// </summary>
        public string Producto { get; set; } = "";

        /// <summary>
        /// Tipo de tanque.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(50, ErrorMessage = "El tipo de tanque debe tener maximo 50 caracteres de longitud.")]
        public string TipoTanque { get; set; } = "";

        /// <summary>
        /// Nombre del tanque.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        public string Tanque { get; set; } = "";

        /// <summary>
        /// Descripcion corta del tanque.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(10, ErrorMessage = "La descripcion corta debe tener maximo 10 caracteres de longitud.")]
        public string DescripcionCorta { get; set; } = "";

        /// <summary>
        /// Codigo MENCOD del tanque.
        /// </summary>
        public string Mencod { get; set; } = "";

        /// <summary>
        /// Altura maxima autorizada del tanque en pies.
        /// </summary>
        public int AlturaMaximaPies { get; set; }

        /// <summary>
        /// Altura maxima autorizada del tanque en pulgadas.
        /// </summary>
        public int AlturaMaximaPulgadas { get; set; }

        /// <summary>
        /// Posicion de techo del tanque.
        /// </summary>
        [Required(ErrorMessage = "Campo Obligatorio")]
        [StringLength(50, ErrorMessage = "La posicion de techo debe tener maximo 50 caracteres de longitud.")]
        public string TipoPosiconTecho { get; set; } = "No aplica";

        /// <summary>
        /// Altura minima autorizada del tanque en pies.
        /// </summary>
        public int AlturaMinimaPies { get; set; }

        /// <summary>
        /// Altura minima autorizada del tanque en pulgadas.
        /// </summary>
        public int AlturaMinimaPulgadas { get; set; }

        /// <summary>
        /// Volumen maximo del tanque.
        /// </summary>
        public decimal VolumenMaximo { get; set; }

        /// <summary>
        /// Volumen minimo del tanque.
        /// </summary>
        public decimal VolumenMinimo { get; set; }

        /// <summary>
        /// Volumen con techo en posicion alta.
        /// </summary>
        public decimal VolumenTechoPosicionAlta { get; set; }

        /// <summary>
        /// Volumen con techo en posicion baja.
        /// </summary>
        public decimal VolumenTechoPosicionBaja { get; set; }

        /// <summary>
        /// Proveedor del tanque.
        /// </summary>
        public string Proveedor { get; set; } = "";

        /// <summary>
        /// Indica si el tanque puede utilizarse para consumo propio.
        /// </summary>
        public bool ConsumoPropio { get; set; }

        /// <summary>
        /// Comentario del tanque.
        /// </summary>
        [StringLength(250, ErrorMessage = "El comentario debe tener maximo 250 caracteres de longitud.")]
        public string Comentario { get; set; } = "";

        /// <summary>
        /// Version del registro para control de cambios.
        /// </summary>
        public int Version { get; set; }

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
        public bool Estatus { get; set; } = true;
        public int AdjuntoCantidad { get; set; }
        public List<TanqueAdjuntoDTO> Adjuntos { get; set; } = new List<TanqueAdjuntoDTO>();
        public string? CodUsuarioEliminacion { get; set; }
        public string? IdUsuarioEliminacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }
        public string AccionLog { get; set; } = "C";
    }
}
