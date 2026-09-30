namespace app
{
    /// <summary>
    /// Menus del Sistema
    /// </summary>
    public enum Menus
    {
        /// <summary>
        /// Menu de Inicio
        /// </summary>
        #region Menus        
        NoSeleccionado = 0,
        /// <summary>
        /// Archivo
        /// </summary>        
        Archivo = 1,
        /// <summary>
        /// Auditoria
        /// </summary>
        Auditoria = 103,
        /// <summary>
        /// Cambio de Password
        /// </summary>        
        CambioPassword = 101,
        /// <summary>
        /// Log de modificaciones
        /// </summary>
        LogModificacion = 102,
        /// <summary>
        /// Gestion
        /// </summary>        
        Gestion = 2,
        /// <summary>
        /// Datos maestros
        /// </summary>
        DatosMaestros = 3,
        /// <summary>
        /// Menu de volumen
        /// </summary>
        MenuVolumen = 4,
        /// <summary>
        /// Menu de consumo propio
        /// </summary>
        MenuConsumoPropio = 5,
        /// <summary>
        /// Menu de colorante
        /// </summary>
        MenuColorante = 6,
        /// <summary>
        /// Menu de aditivo
        /// </summary>
        MenuAditivo = 7,
        /// <summary>
        /// Menu de calibracion
        /// </summary>
        MenuCalibracion = 8,
        /// <summary>
        /// Menu de barco
        /// </summary>
        MenuBarco = 9,
        /// <summary>
        /// Rutas de menu
        /// </summary>
        MenuRuta = 114,
        /// <summary>
        /// Configuracion de correo
        /// </summary>
        ConfiguracionCorreo = 140,
        /// <summary>
        /// Tareas y notificaciones
        /// </summary>
        Tarea = 141,
        /// <summary>
        /// Notificaciones
        /// </summary>
        Notificacion = 142,
        /// <summary>
        /// Configuracion del sistema
        /// </summary>
        ConfiguracionSistema = 144,
        /// <summary>
        /// Tipo de producto
        /// </summary>
        TipoProducto = 115,
        /// <summary>
        /// Socio
        /// </summary>
        Socio = 116,
        /// <summary>
        /// Suplidor
        /// </summary>
        Suplidor = 117,
        /// <summary>
        /// Producto
        /// </summary>
        Producto = 118,
        /// <summary>
        /// Bahia
        /// </summary>
        Bahia = 119,
        /// <summary>
        /// Brazo
        /// </summary>
        Brazo = 120,
        /// <summary>
        /// Metro
        /// </summary>
        Metro = 145,
        /// <summary>
        /// Volumen de tanque
        /// </summary>
        VolumenTanque = 146,
        /// <summary>
        /// Entradas de producto
        /// </summary>
        EntradasProducto = 147,
        AjusteEntradaProducto = 157,
        AjusteSalidaProducto = 158,
        EntradaUnidad = 159,
        SalidaUnidad = 160,
        AutorizadoresCombustible = 161,
        AutorizacionesPendientes = 162,
        /// <summary>
        /// Barco
        /// </summary>
        Barco = 133,
        /// <summary>
        /// Ingreso de barco
        /// </summary>
        IngresoBarco = 135,
        /// <summary>
        /// Ingreso por tuberias
        /// </summary>
        IngresoTuberias = 136,
        /// <summary>
        /// Menu de salidas
        /// </summary>
        Salidas = 10,
        /// <summary>
        /// Menu de producto
        /// </summary>
        MenuProducto = 11,
        /// <summary>Menu de ventas</summary>
        MenuVentas = 12,
        /// <summary>
        /// Menu de etanol
        /// </summary>
        MenuEtanol = 163,
        EtanolEntrada = 164,
        EtanolSalida = 165,
        EtanolCompraVentaSuplidores = 166,
        EtanolIngresoTuberias = 167,
        EtanolEntradaUnidad = 168,
        EtanolSalidaUnidad = 169,
        EtanolAjusteEntrada = 170,
        EtanolAjusteSalida = 171,
        SaldoInicialEtanol = 172,
        /// <summary>
        /// Salida de producto
        /// </summary>
        Salida = 137,
        /// <summary>
        /// Compra venta suplidores
        /// </summary>
        CompraVentaSuplidores = 138,
        /// <summary>
        /// Medicion de tanque en tierra
        /// </summary>
        MedicionTanqueTierra = 134,
        /// <summary>
        /// Tanque
        /// </summary>
        Tanque = 121,
        /// <summary>
        /// Personal
        /// </summary>
        Personal = 122,
        /// <summary>
        /// Compania de inspeccion
        /// </summary>
        CompaniaInspeccion = 123,
        /// <summary>
        /// Personal externo de compania de inspeccion
        /// </summary>
        PersonalExterno = 124,
        /// <summary>
        /// Tuberia
        /// </summary>
        Tuberia = 125,
        /// <summary>
        /// Calibracion de tanque
        /// </summary>
        CapacidadVolumetricaTanque = 129,
        /// <summary>
        /// Calibracion combustible
        /// </summary>
        CalibracionCombustible = 130,
        /// <summary>
        /// Calibracion etanol
        /// </summary>
        CalibracionEtanol = 131,
        /// <summary>
        /// Calibracion aditivo
        /// </summary>
        CalibracionAditivo = 132,
        /// <summary>
        /// Consumo propio
        /// </summary>
        ConsumoPropio = 126,
        /// <summary>
        /// Colorante
        /// </summary>
        Colorante = 127,
        /// <summary>
        /// Aditivo
        /// </summary>
        Aditivo = 128,
        /// <summary>
        /// Salida de aditivo
        /// </summary>
        SalidaAditivo = 148,
        /// <summary>
        /// Salida de colorante
        /// </summary>
        SalidaColorante = 149,
        /// <summary>Menu saldo inicial</summary>
        SaldoInicial = 150,
        /// <summary>Saldo inicial combustible</summary>
        SaldoInicialCombustible = 151,
        /// <summary>Saldo inicial aditivo</summary>
        SaldoInicialAditivo = 152,
        /// <summary>Saldo inicial colorante</summary>
        SaldoInicialColorante = 153,
        /// <summary>
        /// Reporte MovComStandar
        /// </summary>
        MovComStandar = 154,
        /// <summary>
        /// Menu de reportes
        /// </summary>
        Reportes = 155,
        /// <summary>
        /// Reporte de carga por ambiente o estándar.
        /// </summary>
        ReporteCarga = 173,
        /// <summary>
        /// Reporte de ingresos de barcos.
        /// </summary>
        ReporteIngresosBarcos = 174,
        /// <summary>
        /// Tipo de usuario
        /// </summary>                               
        TipoUsuario = 104,
        /// <summary>
        /// Usuario
        /// </summary>                               
        Usuario = 105,
        /// <summary>
        /// Rol
        /// </summary>
        Rol = 106,
        /// <summary>
        /// Configuracion de Usuario
        /// </summary>
        UsuarioConfiguracion = 107,
        /// <summary>
        /// Idioma
        /// </summary>
        Idioma = 108,
        /// <summary>
        /// Menu
        /// </summary>
        Menu = 109,
        /// <summary>
        /// Menu por idioma
        /// </summary>
        MenuIdioma = 110,
        /// <summary>
        /// Tipo de permiso
        /// </summary>
        TipoPermiso = 111,
        /// <summary>
        /// Preferencia de usuario
        /// </summary>
        UsuarioPreferencia = 112,
        /// <summary>
        /// Permisos por rol
        /// </summary>
        Permiso = 113,
        /// <summary>Ventas mensuales por suplidor y producto</summary>
        Venta = 156,
        #endregion
    }
}

