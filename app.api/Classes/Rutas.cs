namespace app
{
    internal static class Rutas
    {
        internal static string Normalizar(string ruta)
        {
            string valor = string.IsNullOrWhiteSpace(ruta) ? "" : ruta.Trim().ToLower();
            if (string.IsNullOrWhiteSpace(valor))
                return "";

            string[] partes = valor.Split('/', StringSplitOptions.RemoveEmptyEntries);
            return "/" + string.Join('/', partes);
        }
    }
}
