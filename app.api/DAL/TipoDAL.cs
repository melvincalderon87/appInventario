namespace app
{
    /// <summary>
    /// 
    /// </summary>
    public enum TipoDAL
    {
        #region DAL
        /// <summary>
        /// Opcion 0 para inicializar 
        /// </summary>
        NoSeleccionado = 0,
        /// <summary>
        /// Opcion 1 para listado de los datos
        /// </summary>
        Listado = 1,
        /// <summary>
        /// Opcion 2 para listar en una lista
        /// </summary>
        Listar = 2,
        /// <summary>
        /// Opcion 3 para agregar
        /// </summary>
        Agregar = 3,
        /// <summary>
        /// Opcion 4 para editar
        /// </summary>
        Editar = 4,
        /// <summary>
        /// Opcion para eliminar
        /// </summary>
        Eliminar = 5,
        /// <summary>
        /// Opcion para reporte
        /// </summary>
        Reporte = 6,
        /// <summary>
        /// Opcion 7 para exportar datos a excel
        /// </summary>
        Exportar = 7,
        /// <summary>
        /// Opcion 8 para obtener llave principal
        /// </summary>
        ObtenerKey = 8,
        /// <summary>
        /// Opcion 9 para obtener registro especifico
        /// </summary>
        Obtener = 9,
        /// <summary>
        /// Opcion 10 para obtener Descripcion 
        /// </summary>
        ObtenerDescripcion = 10,
        /// <summary>
        /// Opcion 11 para obtener Otros
        /// </summary>
        Otro = 11,
        /// <summary>
        /// Opcion 11 Para Verificaciones
        /// </summary>
        Verificacion = 12,
        /// <summary>
        /// Opcion 13 Para Autorizacion
        /// </summary>
        Autorizacion = 13,
        /// <summary>
        /// Opcion 14 Para Log
        /// </summary>
        Log = 14,
        /// <summary>
        /// Opcion 15 Para Obtener Version
        /// </summary>
        Version = 15,
        #endregion
    }
}
