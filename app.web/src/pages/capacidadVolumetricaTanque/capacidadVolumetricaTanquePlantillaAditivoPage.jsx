import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
  MessageBar,
  Select,
  Spinner,
  Text,
  Textarea,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { CapacidadVolumetricaTanqueService } from "../../services/capacidadVolumetricaTanqueService";
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { TanqueService } from "../../services/tanqueService";
import {
  getCapacidadVolumetricaTanqueActionPageThemeStyles,
  useCapacidadVolumetricaTanqueActionPageStyles,
} from "../../styles/pages/capacidadVolumetricaTanque/capacidadVolumetricaTanqueActionPageStyles";
import {
  TANK_VOLUMETRIC_CAPACITY_TEMPLATE_ACCEPT,
  downloadTankVolumetricCapacityDirectTemplate,
  readTankVolumetricCapacityDirectTemplate,
} from "../../utils/tankVolumetricCapacityExcel";

function CapacidadVolumetricaTanquePlantillaAditivoPage() {
  const styles = useCapacidadVolumetricaTanqueActionPageStyles();
  const themeStyles = getCapacidadVolumetricaTanqueActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idTanque = "" } = useParams();
  const [tanque, setTanque] = useState(null);
  const [companias, setCompanias] = useState([]);
  const [datos, setDatos] = useState({
    codCompaniaInspeccion: "",
    fechaCalibracion: "",
    comentarios: "",
  });
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([TanqueService.obtener(idTanque), CompaniaInspeccionService.ListarOpcion()])
      .then(([tanqueData, companiasData]) => {
        if (active) {
          setTanque(tanqueData);
          setCompanias(Array.isArray(companiasData) ? companiasData : []);
        }
      })
      .catch((loadError) => active && setError(loadError.message || t("tankCalibrationLoadError")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [idTanque, t]);

  const update = (key) => (_, data) => setDatos((current) => ({ ...current, [key]: data.value }));
  const downloadTemplate = async () => {
    try {
      setError("");
      await downloadTankVolumetricCapacityDirectTemplate(t, tanque?.tanque);
    } catch (e) {
      setError(e.message || t("tankCalibrationTemplateDownloadError"));
    }
  };
  const uploadTemplate = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setError("");
      const rows = await readTankVolumetricCapacityDirectTemplate(file, t);
      setDetalles(rows);
      setMessage(t("tankCalibrationTemplateLoaded", { count: rows.length }));
    } catch (e) {
      setDetalles([]);
      setError(e.message || t("tankCalibrationTemplateUploadError"));
    } finally {
      event.target.value = "";
    }
  };
  const save = async () => {
    if (!datos.codCompaniaInspeccion || !datos.fechaCalibracion || detalles.length === 0) {
      setError(t("requiredFields"));
      return;
    }
    try {
      setSaving(true);
      setError("");
      await CapacidadVolumetricaTanqueService.importarPlantillaDirecta({
        idTanque,
        codCompaniaInspeccion: Number(datos.codCompaniaInspeccion),
        fechaCalibracion: datos.fechaCalibracion,
        comentarios: datos.comentarios,
        detalles,
      });
      navigate(`/capacidadvolumetricatanque/listar/${encodeURIComponent(idTanque)}`);
    } catch (e) {
      setError(e.message || t("tankCalibrationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <Title2 className={styles.title}>{t("tankCalibrationDirectTemplateTitle")}</Title2>
        <Button
          appearance="secondary"
          onClick={() =>
            navigate(`/capacidadvolumetricatanque/listar/${encodeURIComponent(idTanque)}`)
          }
        >
          {t("back")}
        </Button>
      </div>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}
      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <div className={styles.formSurface} style={themeStyles.surface}>
          <div className={styles.formGrid}>
            <Field label={t("tankCalibrationTank")}>
              <Input value={tanque?.tanque || ""} disabled />
            </Field>
            <Field label={t("tankCalibrationProduct")}>
              <Input value={tanque?.producto || ""} disabled />
            </Field>
            <Field label={t("tankCalibrationInspectionCompany")} required>
              <Select
                value={datos.codCompaniaInspeccion}
                onChange={update("codCompaniaInspeccion")}
              >
                <option value="">{t("selectOption")}</option>
                {companias.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.text}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("tankCalibrationDate")} required>
              <LocalizedDateInput
                value={datos.fechaCalibracion}
                onChange={update("fechaCalibracion")}
              />
            </Field>
            <Field label={t("tankCalibrationComments")}>
              <Textarea rows={3} value={datos.comentarios} onChange={update("comentarios")} />
            </Field>
          </div>
          <div className={styles.toolbar} style={{ marginTop: 20 }}>
            <Button appearance="secondary" onClick={downloadTemplate}>
              {t("tankCalibrationDownloadDirectTemplate")}
            </Button>
            <label>
              <Button as="span" appearance="secondary">
                {t("tankCalibrationUploadDirectTemplate")}
              </Button>
              <input
                hidden
                type="file"
                accept={TANK_VOLUMETRIC_CAPACITY_TEMPLATE_ACCEPT}
                onChange={uploadTemplate}
              />
            </label>
            <Button appearance="primary" disabled={saving || detalles.length === 0} onClick={save}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
          <Text>{t("tankCalibrationTemplateLoaded", { count: detalles.length })}</Text>
        </div>
      )}
    </section>
  );
}

export default CapacidadVolumetricaTanquePlantillaAditivoPage;
