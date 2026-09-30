namespace app.Messages
{
    /// <summary>
    /// Descripcion de los Errores
    /// </summary>
    public class MensajeError
    {
        /// <summary>
        /// Descripcion de los Mensajes de Errores en Diferentes Idiomas
        /// </summary>
        /// <param name="TipoError"></param>
        /// <param name="Idioma"></param>
        /// <returns></returns>
        internal string Descripcion(TipoError TipoError, string Idioma = "")
        {
            if (Idioma == "en-US")
                return Idioma_enUS(TipoError);
            else
                return Idioma_esGT(TipoError);
        }
        internal string Idioma_esGT(TipoError Tipo)
        {
            switch (Tipo)
            {
                case TipoError.ServidorInterno:
                    return "Error [" + (int)TipoError.ServidorInterno + "]: Error interno del servidor";
                case TipoError.Usuario_Nologin:
                    return "Error [" + (int)TipoError.Usuario_Nologin + "]: Usuario no logueado";
                case TipoError.Login_Usuario:
                    return "Error [" + (int)TipoError.Login_Usuario + "]: Usuario no encontrado";
                case TipoError.Login_Password:
                    return "Error [" + (int)TipoError.Login_Password + "]: Contraseña incorrecta";
                case TipoError.Login_General:
                    return "Error [" + (int)TipoError.Login_General + "]: Usuario o contraseña incorrectos";
                case TipoError.Login_Salir:
                    return "Error [" + (int)TipoError.Login_Salir + "]: Error cerrando sesión";
                case TipoError.Home_ObtenerMenu:
                    return "Error [" + (int)TipoError.Home_ObtenerMenu + "]: No se encontraron menús";
                case TipoError.Validacion:
                    return "Error [" + (int)TipoError.Validacion + "]: Validacion no completada";
                case TipoError.RegistroNoEncontrado:
                    return "Error [" + (int)TipoError.RegistroNoEncontrado + "]: Registro no encontrado";
                case TipoError.RegistroRelacionado:
                    return "Error [" + (int)TipoError.RegistroRelacionado + "]: No se puede eliminar el registro porque tiene registros relacionados";
                case TipoError.OperacionNoCompletada:
                    return "Error [" + (int)TipoError.OperacionNoCompletada + "]: No fue posible completar la operacion";
                case TipoError.BaseDatos:
                    return "Error [" + (int)TipoError.BaseDatos + "]: Error ejecutando la operacion en base de datos";
                case TipoError.ParametrosRequeridos:
                    return "Error [" + (int)TipoError.ParametrosRequeridos + "]: Los datos requeridos no fueron enviados";
                case TipoError.SinPermiso:
                    return "Error [" + (int)TipoError.SinPermiso + "]: No tiene permiso para ejecutar esta operacion";
                case TipoError.CamposRequeridos:
                    return "Error [" + (int)TipoError.CamposRequeridos + "]: Hay campos requeridos sin completar";
                case TipoError.IdentificadorRequerido:
                    return "Error [" + (int)TipoError.IdentificadorRequerido + "]: El identificador es requerido";
                case TipoError.IdentificadorInvalido:
                    return "Error [" + (int)TipoError.IdentificadorInvalido + "]: El identificador es invalido";
                case TipoError.RegistroDuplicado:
                    return "Error [" + (int)TipoError.RegistroDuplicado + "]: Ya existe un registro con los mismos datos";
                case TipoError.ValorInvalido:
                    return "Error [" + (int)TipoError.ValorInvalido + "]: El valor enviado es invalido";
                case TipoError.ValorFueraDeRango:
                    return "Error [" + (int)TipoError.ValorFueraDeRango + "]: El valor enviado esta fuera del rango permitido";
                case TipoError.ValorDebeSerMayorACero:
                    return "Error [" + (int)TipoError.ValorDebeSerMayorACero + "]: El valor debe ser mayor que cero";
                case TipoError.PasswordNoCoincide:
                    return "Error [" + (int)TipoError.PasswordNoCoincide + "]: La contrasena y su confirmacion no coinciden";
                case TipoError.PlantillaInvalida:
                    return "Error [" + (int)TipoError.PlantillaInvalida + "]: La plantilla enviada es invalida";
                case TipoError.PlantillaSinDatos:
                    return "Error [" + (int)TipoError.PlantillaSinDatos + "]: La plantilla no contiene datos para cargar";
                case TipoError.RutaNoConfigurada:
                    return "Error [" + (int)TipoError.RutaNoConfigurada + "]: La ruta no esta configurada";
                case TipoError.FormatoInvalido:
                    return "Error [" + (int)TipoError.FormatoInvalido + "]: El formato enviado es invalido";
                case TipoError.FechaInvalida:
                    return "Error [" + (int)TipoError.FechaInvalida + "]: La fecha enviada es invalida";
                case TipoError.ArchivoRequerido:
                    return "Error [" + (int)TipoError.ArchivoRequerido + "]: Debe enviar un archivo";
                case TipoError.ArchivoInvalido:
                    return "Error [" + (int)TipoError.ArchivoInvalido + "]: El archivo enviado es invalido";
                case TipoError.ArchivoNoPermitido:
                    return "Error [" + (int)TipoError.ArchivoNoPermitido + "]: El tipo de archivo no esta permitido";
                case TipoError.TamanoArchivoExcedido:
                    return "Error [" + (int)TipoError.TamanoArchivoExcedido + "]: El archivo excede el tamano permitido";
                case TipoError.ConflictoVersion:
                    return "Error [" + (int)TipoError.ConflictoVersion + "]: El registro fue modificado por otro proceso";
                case TipoError.RecursoNoDisponible:
                    return "Error [" + (int)TipoError.RecursoNoDisponible + "]: El recurso no esta disponible";
                case TipoError.TiempoEspera:
                    return "Error [" + (int)TipoError.TiempoEspera + "]: Se agoto el tiempo de espera de la operacion";
                case TipoError.TransaccionFallida:
                    return "Error [" + (int)TipoError.TransaccionFallida + "]: No fue posible completar la transaccion";
                case TipoError.OperacionNoPermitida:
                    return "Error [" + (int)TipoError.OperacionNoPermitida + "]: La operacion no esta permitida";
                default:
                    return "Sin Error Asignado";
            }
        }
        internal string Idioma_enUS(TipoError TipoError)
        {
            switch (TipoError)
            {
                case TipoError.ServidorInterno:
                    return "Error [" + (int)TipoError.ServidorInterno + "]: Internal server error";
                case TipoError.Usuario_Nologin:
                    return "Error [" + (int)TipoError.Usuario_Nologin + "]: user not login";
                case TipoError.Login_Usuario:
                    return "Error [" + (int)TipoError.Login_Usuario + "]: user not found";
                case TipoError.Login_Password:
                    return "Error [" + (int)TipoError.Login_Password + "]: incorrect password";
                case TipoError.Login_General:
                    return "Error [" + (int)TipoError.Login_General + "]: user or password incorrect";
                case TipoError.Login_Salir:
                    return "Error [" + (int)TipoError.Login_Salir + "]: Error logging out";
                case TipoError.Home_ObtenerMenu:
                    return "Error [" + (int)TipoError.Home_ObtenerMenu + "]: No menus found";
                case TipoError.Validacion:
                    return "Error [" + (int)TipoError.Validacion + "]: Validation was not completed";
                case TipoError.RegistroNoEncontrado:
                    return "Error [" + (int)TipoError.RegistroNoEncontrado + "]: Record not found";
                case TipoError.RegistroRelacionado:
                    return "Error [" + (int)TipoError.RegistroRelacionado + "]: The record cannot be deleted because it has related records";
                case TipoError.OperacionNoCompletada:
                    return "Error [" + (int)TipoError.OperacionNoCompletada + "]: The operation could not be completed";
                case TipoError.BaseDatos:
                    return "Error [" + (int)TipoError.BaseDatos + "]: Error executing the database operation";
                case TipoError.ParametrosRequeridos:
                    return "Error [" + (int)TipoError.ParametrosRequeridos + "]: Required data was not sent";
                case TipoError.SinPermiso:
                    return "Error [" + (int)TipoError.SinPermiso + "]: You do not have permission to execute this operation";
                case TipoError.CamposRequeridos:
                    return "Error [" + (int)TipoError.CamposRequeridos + "]: Required fields are missing";
                case TipoError.IdentificadorRequerido:
                    return "Error [" + (int)TipoError.IdentificadorRequerido + "]: The identifier is required";
                case TipoError.IdentificadorInvalido:
                    return "Error [" + (int)TipoError.IdentificadorInvalido + "]: The identifier is invalid";
                case TipoError.RegistroDuplicado:
                    return "Error [" + (int)TipoError.RegistroDuplicado + "]: A record with the same data already exists";
                case TipoError.ValorInvalido:
                    return "Error [" + (int)TipoError.ValorInvalido + "]: The submitted value is invalid";
                case TipoError.ValorFueraDeRango:
                    return "Error [" + (int)TipoError.ValorFueraDeRango + "]: The submitted value is outside the allowed range";
                case TipoError.ValorDebeSerMayorACero:
                    return "Error [" + (int)TipoError.ValorDebeSerMayorACero + "]: The value must be greater than zero";
                case TipoError.PasswordNoCoincide:
                    return "Error [" + (int)TipoError.PasswordNoCoincide + "]: The password and confirmation do not match";
                case TipoError.PlantillaInvalida:
                    return "Error [" + (int)TipoError.PlantillaInvalida + "]: The submitted template is invalid";
                case TipoError.PlantillaSinDatos:
                    return "Error [" + (int)TipoError.PlantillaSinDatos + "]: The template does not contain data to load";
                case TipoError.RutaNoConfigurada:
                    return "Error [" + (int)TipoError.RutaNoConfigurada + "]: The route is not configured";
                case TipoError.FormatoInvalido:
                    return "Error [" + (int)TipoError.FormatoInvalido + "]: The submitted format is invalid";
                case TipoError.FechaInvalida:
                    return "Error [" + (int)TipoError.FechaInvalida + "]: The submitted date is invalid";
                case TipoError.ArchivoRequerido:
                    return "Error [" + (int)TipoError.ArchivoRequerido + "]: A file must be submitted";
                case TipoError.ArchivoInvalido:
                    return "Error [" + (int)TipoError.ArchivoInvalido + "]: The submitted file is invalid";
                case TipoError.ArchivoNoPermitido:
                    return "Error [" + (int)TipoError.ArchivoNoPermitido + "]: The file type is not allowed";
                case TipoError.TamanoArchivoExcedido:
                    return "Error [" + (int)TipoError.TamanoArchivoExcedido + "]: The file exceeds the allowed size";
                case TipoError.ConflictoVersion:
                    return "Error [" + (int)TipoError.ConflictoVersion + "]: The record was modified by another process";
                case TipoError.RecursoNoDisponible:
                    return "Error [" + (int)TipoError.RecursoNoDisponible + "]: The resource is not available";
                case TipoError.TiempoEspera:
                    return "Error [" + (int)TipoError.TiempoEspera + "]: The operation timed out";
                case TipoError.TransaccionFallida:
                    return "Error [" + (int)TipoError.TransaccionFallida + "]: The transaction could not be completed";
                case TipoError.OperacionNoPermitida:
                    return "Error [" + (int)TipoError.OperacionNoPermitida + "]: The operation is not allowed";
                default:
                    return "error not assigned";
            }
        }
    }
}
