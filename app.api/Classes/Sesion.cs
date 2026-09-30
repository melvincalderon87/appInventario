namespace app
{
    /// <summary>
    /// 
    /// </summary>
    public static class Sesion
    {
        static IServiceProvider? Servicio = null;
        /// <summary>
        /// Provides static access to the framework's services provider
        /// </summary>
        public static IServiceProvider Servicios
        {
            set
            {
                if (Servicio != null)
                {
                    throw new Exception("No se puede asignar, ya fue asignado.");
                }
                Servicio = value;
            }
        }
        /// <summary>
        /// Provides static access to the current HttpContext
        /// </summary>
        public static HttpContext Obtener
        {
            get
            {
                IHttpContextAccessor httpContextAccessor = Servicio.GetService(typeof(IHttpContextAccessor)) as IHttpContextAccessor;
                return httpContextAccessor.HttpContext;
            }
        }
    }
}
