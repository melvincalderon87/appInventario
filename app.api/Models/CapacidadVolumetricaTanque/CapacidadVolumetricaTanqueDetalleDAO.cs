using Microsoft.Data.SqlClient;

namespace app.Models.CapacidadVolumetricaTanque
{
    /// <summary>
    /// Mapeos de persistencia de los detalles de capacidad volumetrica.
    /// Es parte del DAO del encabezado para conservar el flujo transaccional existente.
    /// </summary>
    internal partial class CapacidadVolumetricaTanqueDAO
    {
        private CapacidadVolumetricaTanqueDetalleDTO MapDetalle(SqlDataReader reader)
        {
            CapacidadVolumetricaTanqueDetalleDTO Obj = new CapacidadVolumetricaTanqueDetalleDTO();
            Obj.CodCapacidadVolumetricaTanqueDetalle = Convert.ToInt32(reader["CodCapacidadVolumetricaTanqueDetalle"]);
            Obj.IdCapacidadVolumetricaTanqueDetalle = ObjEncriptacion.Encriptar(Obj.CodCapacidadVolumetricaTanqueDetalle.ToString());
            Obj.CodCapacidadVolumetricaTanque = Convert.ToInt32(reader["CodCapacidadVolumetricaTanque"]);
            Obj.IdCapacidadVolumetricaTanque = ObjEncriptacion.Encriptar(Obj.CodCapacidadVolumetricaTanque.ToString());
            Obj.Pies = Convert.ToInt32(reader["Pies"]);
            Obj.Pulgadas = Convert.ToInt32(reader["Pulgadas"]);
            Obj.Dieciseisavos = Convert.ToInt32(reader["Dieciseisavos"]);
            Obj.Volumen = Convert.ToDecimal(reader["Volumen"]);
            return Obj;
        }
    }
}
