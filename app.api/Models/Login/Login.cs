using System.ComponentModel.DataAnnotations;
namespace app
{
    /// <summary>
    /// Clase de Login 
    /// </summary>
    public class Login
    {
        /// <summary>
        /// Campo de Codigo de Usuario
        /// </summary>                
        public string CodUsuario { get; set; }
        /// <summary>
        /// Campo de Password del Usuario
        /// </summary>    
        public string Password { get; set; }
    }
}
