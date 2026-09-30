using Microsoft.Data.SqlClient;

namespace app.Models.CapacidadVolumetricaTanque
{
    internal partial class CapacidadVolumetricaTanqueDAO
    {
        private CapacidadVolumetricaTanqueDetalle3DTO MapDetalleFraccion(SqlDataReader reader)
        {
            CapacidadVolumetricaTanqueDetalle3DTO Obj = new CapacidadVolumetricaTanqueDetalle3DTO();
            Obj.CodCapacidadVolumetricaTanqueDetalle3 = Convert.ToInt32(reader["CodCapacidadVolumetricaTanqueDetalle3"]);
            Obj.IdCapacidadVolumetricaTanqueDetalle3 = ObjEncriptacion.Encriptar(Obj.CodCapacidadVolumetricaTanqueDetalle3.ToString());
            Obj.CodCapacidadVolumetricaTanque = Convert.ToInt32(reader["CodCapacidadVolumetricaTanque"]);
            Obj.IdCapacidadVolumetricaTanque = ObjEncriptacion.Encriptar(Obj.CodCapacidadVolumetricaTanque.ToString());
            Obj.Dieciseisavos = Convert.ToInt32(reader["Dieciseisavos"]);
            Obj.Volumen = Convert.ToDecimal(reader["Volumen"]);
            return Obj;
        }
    }
}
