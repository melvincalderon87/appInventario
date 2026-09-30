namespace app.Messages
{
    /// <summary>
    /// Tipo de Errores
    /// </summary>    
    public enum TipoError
    {
        #region TipoError
        /// <summary>
        /// Error Usuario No logueado 
        /// </summary>
        ServidorInterno = 1000,
        /// <summary>
        /// Error Interno del Servidor
        /// </summary>
        Usuario_Nologin = 1001,
        /// <summary>
        /// Error de Usuario Ingresado
        /// </summary>
        Login_Usuario = 1002,
        /// <summary>
        /// Error de Password Ingresado
        /// </summary>
        Login_Password = 1003,
        /// <summary>
        /// error General de Login
        /// </summary>
        Login_General = 1004,
        /// <summary>
        /// Error cerrando sesión
        /// </summary>
        Login_Salir = 1005,
        /// <summary>
        /// Error Listar Menus
        /// </summary>
        Home_ObtenerMenu = 1006,
        /// <summary>
        /// Error de validacion de negocio
        /// </summary>
        Validacion = 1100,
        /// <summary>
        /// Registro no encontrado
        /// </summary>
        RegistroNoEncontrado = 1101,
        /// <summary>
        /// Registro con datos relacionados
        /// </summary>
        RegistroRelacionado = 1102,
        /// <summary>
        /// Operacion no completada
        /// </summary>
        OperacionNoCompletada = 1103,
        /// <summary>
        /// Error de base de datos
        /// </summary>
        BaseDatos = 1104,
        /// <summary>
        /// Parametros requeridos no enviados
        /// </summary>
        ParametrosRequeridos = 1105,
        /// <summary>
        /// Usuario sin permiso para la operacion
        /// </summary>
        SinPermiso = 1106,
        /// <summary>
        /// Campos requeridos no enviados
        /// </summary>
        CamposRequeridos = 1107,
        /// <summary>
        /// Identificador requerido
        /// </summary>
        IdentificadorRequerido = 1108,
        /// <summary>
        /// Identificador invalido
        /// </summary>
        IdentificadorInvalido = 1109,
        /// <summary>
        /// Registro duplicado
        /// </summary>
        RegistroDuplicado = 1110,
        /// <summary>
        /// Valor invalido
        /// </summary>
        ValorInvalido = 1111,
        /// <summary>
        /// Valor fuera de rango
        /// </summary>
        ValorFueraDeRango = 1112,
        /// <summary>
        /// Valor debe ser mayor a cero
        /// </summary>
        ValorDebeSerMayorACero = 1113,
        /// <summary>
        /// Password y confirmacion no coinciden
        /// </summary>
        PasswordNoCoincide = 1114,
        /// <summary>
        /// Plantilla invalida
        /// </summary>
        PlantillaInvalida = 1115,
        /// <summary>
        /// Plantilla sin datos
        /// </summary>
        PlantillaSinDatos = 1116,
        /// <summary>
        /// Ruta no configurada
        /// </summary>
        RutaNoConfigurada = 1117,
        /// <summary>
        /// Formato invalido
        /// </summary>
        FormatoInvalido = 1118,
        /// <summary>
        /// Fecha invalida
        /// </summary>
        FechaInvalida = 1119,
        /// <summary>
        /// Archivo requerido
        /// </summary>
        ArchivoRequerido = 1120,
        /// <summary>
        /// Archivo invalido
        /// </summary>
        ArchivoInvalido = 1121,
        /// <summary>
        /// Archivo no permitido
        /// </summary>
        ArchivoNoPermitido = 1122,
        /// <summary>
        /// Tamano de archivo excedido
        /// </summary>
        TamanoArchivoExcedido = 1123,
        /// <summary>
        /// Conflicto de version
        /// </summary>
        ConflictoVersion = 1124,
        /// <summary>
        /// Recurso no disponible
        /// </summary>
        RecursoNoDisponible = 1125,
        /// <summary>
        /// Tiempo de espera agotado
        /// </summary>
        TiempoEspera = 1126,
        /// <summary>
        /// Transaccion fallida
        /// </summary>
        TransaccionFallida = 1127,
        /// <summary>
        /// Operacion no permitida
        /// </summary>
        OperacionNoPermitida = 1128,

        #endregion
    }
}
