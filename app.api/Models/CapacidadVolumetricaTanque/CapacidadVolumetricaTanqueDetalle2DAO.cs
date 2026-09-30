using Microsoft.Data.SqlClient;

namespace app.Models.CapacidadVolumetricaTanque
{
    internal partial class CapacidadVolumetricaTanqueDAO
    {
        private CapacidadVolumetricaTanqueDetalle2DTO MapDetalleBase(SqlDataReader reader)
        {
            CapacidadVolumetricaTanqueDetalle2DTO Obj = new CapacidadVolumetricaTanqueDetalle2DTO();
            Obj.CodCapacidadVolumetricaTanqueDetalle2 = Convert.ToInt32(reader["CodCapacidadVolumetricaTanqueDetalle2"]);
            Obj.IdCapacidadVolumetricaTanqueDetalle2 = ObjEncriptacion.Encriptar(Obj.CodCapacidadVolumetricaTanqueDetalle2.ToString());
            Obj.CodCapacidadVolumetricaTanque = Convert.ToInt32(reader["CodCapacidadVolumetricaTanque"]);
            Obj.IdCapacidadVolumetricaTanque = ObjEncriptacion.Encriptar(Obj.CodCapacidadVolumetricaTanque.ToString());
            Obj.Pies = Convert.ToInt32(reader["Pies"]);
            Obj.Pulgadas = Convert.ToInt32(reader["Pulgadas"]);
            Obj.Volumen = Convert.ToDecimal(reader["Volumen"]);
            return Obj;
        }
    }
}
