using System.Net;
using System.Text.RegularExpressions;

namespace app.Models.Notificacion
{
    internal static class HtmlPolicyValidator
    {
        private static readonly HashSet<string> AllowedTags = new HashSet<string>(
            new[]
            {
                "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li",
                "h1", "h2", "h3", "blockquote", "a", "span", "div"
            },
            StringComparer.OrdinalIgnoreCase);

        private static readonly Regex TagRegex = new Regex(
            @"<\s*/?\s*([a-zA-Z0-9]+)(?<attributes>\s[^>]*)?>",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

        private static readonly Regex AttributeRegex = new Regex(
            "(?<name>[a-zA-Z_:][a-zA-Z0-9_:.-]*)\\s*(?:=\\s*(?:\\\"[^\\\"]*\\\"|'[^']*'|[^\\s\\\"'=<>`]+))?",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

        private static readonly HashSet<string> AllowedLinkAttributes = new HashSet<string>(
            new[] { "href", "target", "rel" }, StringComparer.OrdinalIgnoreCase);

        private static readonly HashSet<string> AllowedTextAttributes = new HashSet<string>(
            new[] { "style" }, StringComparer.OrdinalIgnoreCase);

        internal static bool EsValido(string html, out string mensaje)
        {
            mensaje = "";
            string valor = html ?? "";

            if (string.IsNullOrWhiteSpace(TextoPlano(valor)))
            {
                mensaje = "El texto de la notificacion es requerido.";
                return false;
            }

            if (Regex.IsMatch(valor, @"<\s*(script|iframe|object|embed|form|input|button|style|link|meta)\b", RegexOptions.IgnoreCase))
            {
                mensaje = "El texto contiene etiquetas HTML no permitidas.";
                return false;
            }

            if (Regex.IsMatch(valor, @"\son[a-z]+\s*=", RegexOptions.IgnoreCase))
            {
                mensaje = "El texto contiene atributos HTML no permitidos.";
                return false;
            }

            if (Regex.IsMatch(valor, @"(href|src)\s*=\s*[""']?\s*(javascript|data|vbscript):", RegexOptions.IgnoreCase))
            {
                mensaje = "El texto contiene enlaces no permitidos.";
                return false;
            }

            foreach (Match match in TagRegex.Matches(valor))
            {
                string tag = match.Groups[1].Value;
                if (!AllowedTags.Contains(tag))
                {
                    mensaje = "El texto contiene etiquetas HTML no permitidas.";
                    return false;
                }

                string attributes = match.Groups["attributes"].Value;
                foreach (Match attribute in AttributeRegex.Matches(attributes))
                {
                    string name = attribute.Groups["name"].Value;
                    bool allowed = tag.Equals("a", StringComparison.OrdinalIgnoreCase)
                        ? AllowedLinkAttributes.Contains(name)
                        : AllowedTextAttributes.Contains(name);

                    if (!allowed)
                    {
                        mensaje = "El texto contiene atributos HTML no permitidos.";
                        return false;
                    }
                }

                if (attributes.Contains("style", StringComparison.OrdinalIgnoreCase)
                    && Regex.IsMatch(attributes, @"(expression\s*\(|url\s*\(|@import|behavior\s*:|-moz-binding)", RegexOptions.IgnoreCase))
                {
                    mensaje = "El texto contiene estilos HTML no permitidos.";
                    return false;
                }
            }

            return true;
        }

        internal static string TextoPlano(string html)
        {
            string sinEtiquetas = Regex.Replace(html ?? "", "<.*?>", " ");
            return WebUtility.HtmlDecode(sinEtiquetas)
                .Replace("\u00A0", " ")
                .Trim();
        }
    }
}
