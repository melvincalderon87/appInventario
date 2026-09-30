using System.Text.RegularExpressions;

namespace app
{
    /// <summary>
    /// Utilidad para detectar patrones comunes de SQL injection en parámetros de entrada.
    /// </summary>
    public static class validateSQL
    {
        private static readonly Regex[] InjectionPatterns =
        {
            new(@"(--|/\*|\*/|;)", RegexOptions.Compiled),
            new(@"\b(select|insert|update|delete|drop|alter|create|truncate|exec|execute|union|merge)\b", RegexOptions.Compiled | RegexOptions.IgnoreCase),
            new(@"\b(or|and)\b\s+[\w\[\]'.-]+\s*=\s*[\w\[\]'.-]+", RegexOptions.Compiled | RegexOptions.IgnoreCase),
            new(@"'\s*(or|and)\s*'", RegexOptions.Compiled | RegexOptions.IgnoreCase),
            new(@"\b(waitfor\s+delay|xp_cmdshell|sp_executesql)\b", RegexOptions.Compiled | RegexOptions.IgnoreCase)
        };

        public static bool EsSeguro(string? parametro)
        {
            if (string.IsNullOrWhiteSpace(parametro))
                return true;

            return !InjectionPatterns.Any(pattern => pattern.IsMatch(parametro));
        }

        public static void Validar(string? parametro, string nombreParametro = "parametro")
        {
            if (!EsSeguro(parametro))
                throw new ArgumentException("El parametro contiene patrones no permitidos.", nombreParametro);
        }
    }
}
