namespace app.Classes
{
    /// <summary>
    /// Clase para encriptar parámetros 
    /// </summary>
    public class EncriptarParametros
    {
        ///// <summary>
        ///// Encriptar un parámetro
        ///// </summary>
        ///// <param name="Parametro"></param>
        ///// <returns></returns>
        public static string Encriptar(string Parametro)
        {
            Encriptacion Encriptacion = new Encriptacion();
            string ParametroEncriptado = Encriptacion.Encriptar(Parametro);
            return ParametroEncriptado;
        }
    }
}
