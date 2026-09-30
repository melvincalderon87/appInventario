namespace app
{
    /// <summary>
    /// clases para listado de permisos que puede tener el usuario en cada modulo
    /// </summary>
    public enum Permisos
    {
        #region TipoPermiso
        /// <summary>
        /// No seleccionado es la opcion para descartar los permisos
        /// </summary>        
        NoSeleccionado = 0,
        /// <summary>
        /// Listado indica si tiene acceso a listar los registros
        /// </summary>        
        Listar = 1,
        /// <summary>
        /// Agregar indica si tiene acceso a adicionar un nuevo registro
        /// </summary>        
        Agregar = 2,
        /// <summary>
        /// Editar indica si tiene acceso a modificar un registro 
        /// </summary>        
        Editar = 3,
        /// <summary>
        /// Eliminar indica si tiene acceso a borrar un registro
        /// </summary>        
        Eliminar = 4,
        /// <summary>
        /// Visualizar indica si tiene acceso a ver el detalle de un registro
        /// </summary>        
        Visualizar = 5,
        /// <summary>
        /// Imprimir indica si tiene acceso a imprimir
        /// </summary>        
        Imprimir = 6,
        /// <summary>
        /// Reporte indica si tiene acceso a generar reporte
        /// </summary>        
        Reporte = 7,
        /// <summary>
        /// Exportar indica si tiene acceso a exportar los registros
        /// </summary>        
        Exportar = 8,
        /// <summary>
        /// Aprobar indica si tiene acceso a aprobar registros
        /// </summary>        
        Aprobar = 9,
        /// <summary>
        /// Log indica si tiene acceso a ver el historial de registros
        /// </summary>        
        Log = 10,
        /// <summary>
        /// Otro indica un permiso adicional definido para el modulo    
        /// </summary>
        Otro = 11,
        /// <summary>
        /// Menu indica si tiene acceso a ver el menu de un modulo    
        /// </summary>
        Menu = 12,
        #endregion
    }
}
