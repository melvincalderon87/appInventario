using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;

namespace app
{
    internal class ComparacionObjetos
    {
        private static readonly HashSet<string> PropiedadesIgnoradas = new HashSet<string>(
            new[]
            {
                "Id",
                "Version",
                "CodUsuarioCreacion",
                "IdUsuarioCreacion",
                "FechaCreacion",
                "CodUsuarioActualizacion",
                "IdUsuarioActualizacion",
                "FechaActualizacion",
                "Password",
                "Children",
                "Usuario",
                "TipoUsuario",
                "Rol",
                "Menu",
                "MenuDescripcion",
                "TipoPermisoDescripcion",
                "RolDescripcion",
            },
            StringComparer.OrdinalIgnoreCase);

        internal static string ObtenerCambios(object? Anterior, object? Nuevo)
        {
            if (Anterior == null && Nuevo == null)
                return "";

            StringBuilder sb = new StringBuilder();
            Type? tipoAnterior = Anterior?.GetType();
            Type? tipoNuevo = Nuevo?.GetType();
            IEnumerable<string> nombres = ObtenerNombresPropiedades(tipoAnterior, tipoNuevo);

            foreach (string nombre in nombres)
            {
                if (DebeIgnorar(nombre))
                    continue;

                PropertyInfo? propiedadAnterior = tipoAnterior?.GetProperty(nombre);
                PropertyInfo? propiedadNueva = tipoNuevo?.GetProperty(nombre);

                if (!EsPropiedadLegible(propiedadAnterior) && !EsPropiedadLegible(propiedadNueva))
                    continue;

                if (!EsTipoSimple(propiedadAnterior?.PropertyType ?? propiedadNueva?.PropertyType))
                    continue;

                object? valorAnterior = propiedadAnterior != null && Anterior != null ? propiedadAnterior.GetValue(Anterior) : null;
                object? valorNuevo = propiedadNueva != null && Nuevo != null ? propiedadNueva.GetValue(Nuevo) : null;

                if (SonIguales(valorAnterior, valorNuevo))
                    continue;

                sb.AppendLine("[Propiedad:" + nombre);
                sb.AppendLine("Anterior:" + FormatearValor(valorAnterior));
                sb.AppendLine("Nuevo:" + FormatearValor(valorNuevo) + "]\n");
            }

            return sb.Length == 0 ? "Sin cambios detectados" : sb.ToString();
        }

        private static IEnumerable<string> ObtenerNombresPropiedades(Type? tipoAnterior, Type? tipoNuevo)
        {
            List<string> nombres = new List<string>();

            if (tipoAnterior != null)
            {
                nombres.AddRange(tipoAnterior
                    .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .Select(propiedad => propiedad.Name));
            }

            if (tipoNuevo != null)
            {
                nombres.AddRange(tipoNuevo
                    .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .Select(propiedad => propiedad.Name));
            }

            return nombres.Distinct(StringComparer.OrdinalIgnoreCase);
        }

        private static bool EsPropiedadLegible(PropertyInfo? propiedad)
        {
            return propiedad != null &&
                propiedad.CanRead &&
                propiedad.GetIndexParameters().Length == 0;
        }

        private static bool DebeIgnorar(string nombre)
        {
            if (PropiedadesIgnoradas.Contains(nombre))
                return true;

            return nombre.Length > 2 &&
                nombre.StartsWith("Id", StringComparison.Ordinal) &&
                char.IsUpper(nombre[2]);
        }

        private static bool EsTipoSimple(Type? tipo)
        {
            if (tipo == null)
                return false;

            Type tipoReal = Nullable.GetUnderlyingType(tipo) ?? tipo;

            return tipoReal.IsPrimitive ||
                tipoReal.IsEnum ||
                tipoReal == typeof(string) ||
                tipoReal == typeof(decimal) ||
                tipoReal == typeof(DateTime) ||
                tipoReal == typeof(Guid);
        }

        private static bool SonIguales(object? valorAnterior, object? valorNuevo)
        {
            if (valorAnterior == null && valorNuevo == null)
                return true;

            if (valorAnterior == null || valorNuevo == null)
                return false;

            if (valorAnterior is DateTime fechaAnterior && valorNuevo is DateTime fechaNuevo)
                return fechaAnterior == fechaNuevo;

            return string.Equals(
                Convert.ToString(valorAnterior),
                Convert.ToString(valorNuevo),
                StringComparison.Ordinal);
        }

        private static string FormatearValor(object? valor)
        {
            if (valor == null)
                return "";

            if (valor is DateTime fecha)
                return fecha.ToString("dd/MM/yyyy HH:mm");

            return Convert.ToString(valor) ?? "";
        }
    }
}
