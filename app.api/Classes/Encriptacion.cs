using System.Security.Cryptography;
using System.Text;

namespace app
{
    /// <summary>
    /// Clase para Encriptar
    /// </summary>
    internal class Encriptacion
    {
        /// <summary>
        /// Clave para encriptar y desencriptar datos
        /// </summary>
        private readonly string Password_Key = "$0p0rteTecnic0";
        /// <summary>
        /// Encripta un texto usando AES
        /// </summary>
        /// <param name="Texto"></param>
        /// <returns></returns>
        public string Encriptar(string Texto)
        {
            if (Texto == null) return null;
            var bytesToBeEncrypted = Encoding.UTF8.GetBytes(Texto);
            var Password_KeyBytes = SHA512.Create().ComputeHash(Encoding.UTF8.GetBytes(Password_Key));
            var bytesEncrypted = Encrypt(bytesToBeEncrypted, Password_KeyBytes);
            return Convert.ToBase64String(bytesEncrypted);
        }
        /// <summary>
        /// Desencripta un texto encriptado con AES
        /// </summary>
        /// <param name="Texto"></param>
        /// <returns></returns>
        public string Desencriptar(string Texto)
        {
            if (Texto == null) return null;
            var bytesToBeDecrypted = Convert.FromBase64String(Texto);
            var Password_KeyBytes = SHA512.Create().ComputeHash(Encoding.UTF8.GetBytes(Password_Key));
            var bytesDecrypted = Decrypt(bytesToBeDecrypted, Password_KeyBytes);
            return Encoding.UTF8.GetString(bytesDecrypted);
        }
        /// <summary>
        /// Encripta un arreglo de bytes usando AES
        /// </summary>
        /// <param name="bytesToBeEncrypted"></param>
        /// <param name="Password_KeyBytes"></param>
        /// <returns></returns>
        private byte[] Encrypt(byte[] bytesToBeEncrypted, byte[] Password_KeyBytes)
        {
            byte[] encryptedBytes;
            var saltBytes = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 };
            using (MemoryStream ms = new())
            using (Aes AES = Aes.Create())
            {
                byte[] key = Rfc2898DeriveBytes.Pbkdf2(Password_KeyBytes, saltBytes, 1000, HashAlgorithmName.SHA256, 32);
                AES.KeySize = 256;
                AES.BlockSize = 128;
                AES.Key = key;
                AES.IV = new byte[16];
                AES.Mode = CipherMode.CBC;

                using var cs = new CryptoStream(ms, AES.CreateEncryptor(), CryptoStreamMode.Write);
                cs.Write(bytesToBeEncrypted, 0, bytesToBeEncrypted.Length);
                cs.Close();

                encryptedBytes = ms.ToArray();
            }
            return encryptedBytes;
        }
        /// <summary>
        /// Desencripta un arreglo de bytes encriptado con AES
        /// </summary>
        /// <param name="bytesToBeDecrypted"></param>
        /// <param name="Password_KeyBytes"></param>
        /// <returns></returns>
        private byte[] Decrypt(byte[] bytesToBeDecrypted, byte[] Password_KeyBytes)
        {
            byte[] decryptedBytes;
            var saltBytes = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 };
            using (MemoryStream ms = new())
            using (Aes AES = Aes.Create())
            {
                byte[] key = Rfc2898DeriveBytes.Pbkdf2(Password_KeyBytes, saltBytes, 1000, HashAlgorithmName.SHA256, 32);
                AES.KeySize = 256;
                AES.BlockSize = 128;
                AES.Key = key;
                AES.IV = new byte[16];
                AES.Mode = CipherMode.CBC;

                using var cs = new CryptoStream(ms, AES.CreateDecryptor(), CryptoStreamMode.Write);
                cs.Write(bytesToBeDecrypted, 0, bytesToBeDecrypted.Length);
                cs.Close();

                decryptedBytes = ms.ToArray();
            }
            return decryptedBytes;
        }
        /// <summary>
        /// Encriptar datos en forma Hexadecimal
        /// </summary>
        /// <param name="Texto"></param>
        /// <returns></returns>
        internal string EncriptarHex(string Texto)
        {
            if (Texto == null)
            {
                return null;
            }
            // Get the bytes of the string
            var bytesToBeEncrypted = Encoding.UTF8.GetBytes(Texto);
            var Password_KeyBytes = Encoding.UTF8.GetBytes(Password_Key);
            // Hash the Password_Key with SHA256
            Password_KeyBytes = SHA512.Create().ComputeHash(Password_KeyBytes);
            var bytesEncrypted = Encrypt(bytesToBeEncrypted, Password_KeyBytes);
            //Tranformar Texto en Byte
            string TextoRetorno = Texto_HEX(Convert.ToBase64String(bytesEncrypted));
            return TextoRetorno;
        }
        ///<summary>
        /// DesEncriptar datos en forma Hexadecimal
        ///</summary>
        ///<param name = "Texto" ></param>
        ///<returns ></returns >
        internal string DesencriptarHex(string Texto)
        {
            if (Texto == null)
            {
                return null;
            }
            Texto = HEX_Texto(Texto);
            var bytesToBeDecrypted = Convert.FromBase64String(Texto);
            var Password_KeyBytes = Encoding.UTF8.GetBytes(Password_Key);
            Password_KeyBytes = SHA512.Create().ComputeHash(Password_KeyBytes);
            var bytesDecrypted = Decrypt(bytesToBeDecrypted, Password_KeyBytes);
            return Encoding.UTF8.GetString(bytesDecrypted);
        }
        /// <summary>
        /// Convierte un texto a su representación hexadecimal
        /// </summary>
        /// <param name="Texto"></param>
        /// <returns></returns>
        private string Texto_HEX(string Texto)
        {
            byte[] convertedByte = Encoding.Unicode.GetBytes(Texto);
            string Texto_hex = BitConverter.ToString(convertedByte);
            Texto_hex = Texto_hex.Replace("-", "");
            return Texto_hex;
        }
        /// <summary>
        /// Convierte un texto hexadecimal a su representación de bytes
        /// </summary>
        /// <param name="Texto"></param>
        /// <returns></returns>
        private string HEX_Texto(string Texto)
        {
            byte[] Texto_byte = ConvertirCadenaToBytes(Texto);
            string TextoByte = Encoding.Unicode.GetString(Texto_byte);
            return TextoByte;
        }
        /// <summary>
        /// Convierte una cadena hexadecimal a un arreglo de bytes
        /// </summary>
        /// <param name="HexString"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentNullException"></exception>
        /// <exception cref="ArgumentException"></exception>
        private byte[] ConvertirCadenaToBytes(string HexString)
        {
            if (HexString == null)
                throw new ArgumentNullException("HexString");
            if (HexString.Length % 2 != 0)
                throw new ArgumentException("HexString must have an even length", "HexString");
            var bytes = new byte[HexString.Length / 2];
            for (int i = 0; i < bytes.Length; i++)
            {
                string currentHex = HexString.Substring(i * 2, 2);
                bytes[i] = Convert.ToByte(currentHex, 16);
            }
            return bytes;
        }
        /// <summary>
        /// Genera una cadena aleatoria de 7 caracteres alfanuméricos
        /// </summary>
        /// <returns></returns>
        internal string CadenaAleatoria()
        {
            Random obj = new Random();
            string sCadena = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
            int longitud = sCadena.Length;
            char cletra;
            int nlongitud = 7;
            string sNuevacadena = string.Empty;
            for (int i = 0; i < nlongitud; i++)
            {
                cletra = sCadena[obj.Next(nlongitud)];
                sNuevacadena += cletra.ToString();
            }
            return sNuevacadena;
        }
    }
}
