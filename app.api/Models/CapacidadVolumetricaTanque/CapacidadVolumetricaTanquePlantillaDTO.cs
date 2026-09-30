namespace app.Models.CapacidadVolumetricaTanque
{
    /// <summary>
    /// DTO para reemplazar los detalles de capacidad volumetrica de un tanque desde una plantilla.
    /// </summary>
    public class CapacidadVolumetricaTanquePlantillaDTO
    {
        /// <summary>
        /// Identificador del tanque en formato encriptado.
        /// </summary>
        public string? IdTanque { get; set; }

        /// <summary>
        /// Codigo del producto relacionado al documento generado.
        /// </summary>
        public int CodProducto { get; set; }

        /// <summary>
        /// Codigo de la compania de inspeccion relacionada al documento generado.
        /// </summary>
        public int CodCompaniaInspeccion { get; set; }

        /// <summary>
        /// Fecha de calibracion del documento generado desde la plantilla.
        /// </summary>
        public DateTime? FechaCalibracion { get; set; }

        /// <summary>
        /// Comentarios del documento generado desde la plantilla.
        /// </summary>
        public string Comentarios { get; set; } = "";

        /// <summary>
        /// Detalles que reemplazaran a los existentes.
        /// </summary>
        public List<CapacidadVolumetricaTanqueDetalleDTO> Detalles { get; set; } = new List<CapacidadVolumetricaTanqueDetalleDTO>();
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
