namespace app.Messages
{
    /// <summary>
    /// Descripcion de los Mensajes de las Operaciones en Diferentes Idiomas
    /// </summary>
    public class MensajeOperacion
    {
        /// <summary>
        /// Descripción de Mensajes de las Operaciones en Diferentes Idiomas
        /// </summary>
        /// <param name="TipoOperacion"></param>
        /// <param name="Idioma"></param>
        /// <returns></returns>
        internal string Descripcion(TipoOperacion TipoOperacion, string Idioma = "")
        {
            if (Idioma == "en-US")
                return Idioma_enUS(TipoOperacion);
            else
                return Idioma_esGT(TipoOperacion);
        }
        /// <summary>
        /// Descripción de Mensajes de las Operaciones en Español
        /// </summary>
        /// <param name="Tipo"></param>
        /// <returns></returns>
        internal string Idioma_esGT(TipoOperacion Tipo)
        {
            switch (Tipo)
            {
                case TipoOperacion.Listar:
                    return "Listado obtenido con exito";
                case TipoOperacion.Agregar:
                    return "Registro Agregado Con Exito";
                case TipoOperacion.Editar:
                    return "Registro Editado Con Exito";
                case TipoOperacion.Eliminar:
                    return "Registro Eliminado Con Exito";
                case TipoOperacion.Password:
                    return "Password Actualizado Con Exito";
                case TipoOperacion.Login:
                    return "Inicio Exitoso";
                case TipoOperacion.Salir:
                    return "Salida Exitosa";
                default:
                    return "";
            }
        }
        /// <summary>
        /// Descripción de Mensajes de las Operaciones en Inglés
        /// </summary>
        /// <param name="Tipo"></param>
        /// <returns></returns>
        internal string Idioma_enUS(TipoOperacion Tipo)
        {
            switch (Tipo)
            {
                case TipoOperacion.Listar:
                    return "List retrieved successfully";
                case TipoOperacion.Agregar:
                    return "Record Added Successfully";
                case TipoOperacion.Editar:
                    return "Record Edited Successfully";
                case TipoOperacion.Eliminar:
                    return "Record Successfully Deleted";
                case TipoOperacion.Password:
                    return "Password Updated Successfully";
                case TipoOperacion.Login:
                    return "Login Successful";
                case TipoOperacion.Salir:
                    return "Logout Successful";
                default:
                    return "";
            }
        }
    }
}
