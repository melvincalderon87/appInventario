namespace app.Messages
{
    /// <summary>
    /// Mensaje de Operaciones
    /// </summary>    
    public enum TipoOperacion
    {
        #region TipoOperacion
        /// <summary>
        /// Listar Registros
        /// </summary>         
        Listar = 1,
        /// <summary>
        /// Agregar un nuevo registro
        /// </summary>         
        Agregar = 2,
        /// <summary>
        /// Editar un registro existente
        /// </summary>
        Editar = 3,
        /// <summary>
        /// Eliminar un registro existente
        /// </summary>
        Eliminar = 4,
        /// <summary>
        /// <summary>
        /// Actualizar la contraseña de un usuario
        /// </summary>
        Password = 5,
        /// <summary>
        /// Login de un usuario
        /// </summary>
        Login = 6,
        /// <summary>
        /// Salir de un usuario
        /// </summary>
        Salir = 7
        #endregion
    }
}
