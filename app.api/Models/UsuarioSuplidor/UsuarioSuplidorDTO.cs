namespace app.Models.UsuarioSuplidores
{
    /// <summary>Suplidor autorizado para consulta por un usuario.</summary>
    public class UsuarioSuplidorDTO
    {
        public string IdUsuario { get; set; } = "";
        public string CodUsuario { get; set; } = "";
        public string CodSuplidor { get; set; } = "";
        public string IdSuplidor { get; set; } = "";
        public string Suplidor { get; set; } = "";
        public bool Seleccionado { get; set; }
    }

    public class UsuarioSuplidorGuardarDTO
    {
        public string IdUsuario { get; set; } = "";
        public List<string> CodSuplidores { get; set; } = new List<string>();
    }
}
