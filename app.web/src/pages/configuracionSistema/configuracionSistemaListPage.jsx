import { useCallback, useEffect, useState } from "react";
import {
  Field,
  Input,
  MessageBar,
  Spinner,
  Text,
  Textarea,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { ListActionButton } from "../../components/common/ListActionButton";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { ConfiguracionSistemaService } from "../../services/configuracionSistemaService";
import {
  getConfiguracionSistemaActionPageThemeStyles,
  useConfiguracionSistemaActionPageStyles,
} from "../../styles/pages/configuracionSistema/configuracionSistemaActionPageStyles";

const EMPTY_EMPRESA = {
  codConfiguracionSistema: 1,
  nombreComercial: "",
  nombreFiscal: "",
  nit: "",
  direccion: "",
  telefono: "",
  paginaWeb: "",
  logoNombreArchivo: "",
  logoTipoContenido: "",
  logoTamanoBytes: 0,
  logoRutaArchivo: "",
  logoContenidoBase64: "",
  version: 0,
};
const EMPTY_FONDO = {
  codConfiguracionSistema: 1,
  fondoNombreArchivo: "",
  fondoTipoContenido: "",
  fondoTamanoBytes: 0,
  fondoRutaArchivo: "",
  fondoContenidoBase64: "",
  version: 0,
};
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function size(value) {
  const n = Number(value) || 0;
  return n < 1024 * 1024 ? `${Math.ceil(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
function readImage(file, key) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        [key]: String(reader.result || "")
          .split(",")
          .pop(),
        nombre: file.name,
        tipo: file.type || "image/jpeg",
        tamano: file.size,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function validImage(file) {
  return (
    ["image/jpeg", "image/png"].includes(String(file.type || "").toLowerCase()) &&
    /\.(jpg|jpeg|jpe|jfif|png)$/i.test(file.name || "")
  );
}

function ConfiguracionSistemaListPage() {
  const styles = useConfiguracionSistemaActionPageStyles();
  const themeStyles = getConfiguracionSistemaActionPageThemeStyles();
  const { t } = useTranslation();
  const { tienePermiso } = usePermisosPantalla();
  const [empresa, setEmpresa] = useState(EMPTY_EMPRESA);
  const [fondo, setFondo] = useState(EMPTY_FONDO);
  const [tab, setTab] = useState("empresa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [fondoPreview, setFondoPreview] = useState("");
  const canEdit = tienePermiso("editar");
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ConfiguracionSistemaService.obtener();
      setEmpresa({ ...EMPTY_EMPRESA, ...data.empresa, logoContenidoBase64: "" });
      setFondo({ ...EMPTY_FONDO, ...data.fondo, fondoContenidoBase64: "" });
    } catch (e) {
      setError(e.message || t("systemConfigurationLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(
    () => () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (fondoPreview) URL.revokeObjectURL(fondoPreview);
    },
    [logoPreview, fondoPreview]
  );
  const updateEmpresa = (key) => (_, data) =>
    setEmpresa((current) => ({ ...current, [key]: data.value }));
  const fileEmpresa = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!validImage(file) || file.size > MAX_FILE_BYTES) {
      setError(t("systemConfigurationLogoInvalid"));
      return;
    }
    const image = await readImage(file, "logoContenidoBase64");
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
    setEmpresa((c) => ({
      ...c,
      logoNombreArchivo: image.nombre,
      logoTipoContenido: image.tipo,
      logoTamanoBytes: image.tamano,
      logoContenidoBase64: image.logoContenidoBase64,
    }));
  };
  const fileFondo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!validImage(file) || file.size > MAX_FILE_BYTES) {
      setError(t("systemConfigurationBackgroundInvalid"));
      return;
    }
    const image = await readImage(file, "fondoContenidoBase64");
    if (fondoPreview) URL.revokeObjectURL(fondoPreview);
    setFondoPreview(URL.createObjectURL(file));
    setFondo((c) => ({
      ...c,
      fondoNombreArchivo: image.nombre,
      fondoTipoContenido: image.tipo,
      fondoTamanoBytes: image.tamano,
      fondoContenidoBase64: image.fondoContenidoBase64,
    }));
  };
  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      if (tab === "empresa") await ConfiguracionSistemaService.guardarEmpresa(empresa);
      else await ConfiguracionSistemaService.guardarFondo(fondo);
      await load();
      setMessage(t("systemConfigurationSaved"));
    } catch (e) {
      setError(e.message || t("systemConfigurationSaveError"));
    } finally {
      setSaving(false);
    }
  };
  const logoUrl =
    logoPreview ||
    (empresa.logoRutaArchivo ? ConfiguracionSistemaService.logoUrl(empresa.version) : "");
  const fondoUrl =
    fondoPreview ||
    (fondo.fondoRutaArchivo ? ConfiguracionSistemaService.fondoUrl(fondo.version) : "");
  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <Title2 className={styles.title}>{t("systemConfigurationTitle")}</Title2>
      </div>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}
      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingSystemConfiguration")} />
          </div>
        ) : (
          <>
            <div className={styles.tabs} role="tablist" aria-label={t("systemConfigurationTitle")}>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "empresa"}
                className={styles.tabButton}
                onClick={() => setTab("empresa")}
              >
                {t("systemConfigurationCompanyTab")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "fondo"}
                className={styles.tabButton}
                onClick={() => setTab("fondo")}
              >
                {t("systemConfigurationBackgroundTab")}
              </button>
            </div>
            {tab === "empresa" ? (
              <div className={styles.formRows}>
                <div className={`${styles.formRow} ${styles.formRowTwo}`}>
                  <Field label={t("systemConfigurationCommercialName")}>
                    <Input
                      value={empresa.nombreComercial}
                      disabled={!canEdit}
                      onChange={updateEmpresa("nombreComercial")}
                    />
                  </Field>
                  <Field label={t("systemConfigurationFiscalName")}>
                    <Input
                      value={empresa.nombreFiscal}
                      disabled={!canEdit}
                      onChange={updateEmpresa("nombreFiscal")}
                    />
                  </Field>
                  <Field label={t("systemConfigurationNit")}>
                    <Input
                      value={empresa.nit}
                      disabled={!canEdit}
                      onChange={updateEmpresa("nit")}
                    />
                  </Field>
                  <Field label={t("systemConfigurationPhone")}>
                    <Input
                      value={empresa.telefono}
                      disabled={!canEdit}
                      onChange={updateEmpresa("telefono")}
                    />
                  </Field>
                </div>
                <Field label={t("systemConfigurationAddress")}>
                  <Textarea
                    value={empresa.direccion}
                    disabled={!canEdit}
                    onChange={updateEmpresa("direccion")}
                  />
                </Field>
                <Field label={t("systemConfigurationWebsite")}>
                  <Input
                    value={empresa.paginaWeb}
                    disabled={!canEdit}
                    onChange={updateEmpresa("paginaWeb")}
                  />
                </Field>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={t("systemConfigurationLogo")}
                    style={{ maxWidth: "300px", maxHeight: "180px", objectFit: "contain" }}
                  />
                ) : (
                  <Text>{t("systemConfigurationNoLogo")}</Text>
                )}
                <div className={`${styles.formRow} ${styles.formRowTwo}`}>
                  <Field label={t("systemConfigurationLogoFile")}>
                    <Input value={empresa.logoNombreArchivo} disabled />
                  </Field>
                  <Field label={t("systemConfigurationBackgroundSize")}>
                    <Input value={size(empresa.logoTamanoBytes)} disabled />
                  </Field>
                </div>
                {canEdit ? (
                  <Field label={t("systemConfigurationLogo")}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.jpe,.jfif,.png,image/jpeg,image/png"
                      disabled={saving}
                      onChange={fileEmpresa}
                    />
                  </Field>
                ) : null}
              </div>
            ) : (
              <div className={styles.formRows}>
                {fondoUrl ? (
                  <img
                    src={fondoUrl}
                    alt={t("systemConfigurationBackground")}
                    style={{
                      width: "100%",
                      maxWidth: "720px",
                      aspectRatio: "16 / 9",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Text>{t("systemConfigurationNoBackground")}</Text>
                )}
                <div className={`${styles.formRow} ${styles.formRowTwo}`}>
                  <Field label={t("systemConfigurationBackgroundFile")}>
                    <Input value={fondo.fondoNombreArchivo} disabled />
                  </Field>
                  <Field label={t("systemConfigurationBackgroundSize")}>
                    <Input value={size(fondo.fondoTamanoBytes)} disabled />
                  </Field>
                </div>
                {canEdit ? (
                  <Field label={t("systemConfigurationBackground")}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.jpe,.jfif,.png,image/jpeg,image/png"
                      disabled={saving}
                      onChange={fileFondo}
                    />
                  </Field>
                ) : null}
              </div>
            )}
            {canEdit ? (
              <div className={styles.buttonRow}>
                <ListActionButton
                  action="editar"
                  label={t("save")}
                  text={saving ? t("saving") : t("save")}
                  disabled={saving}
                  onClick={save}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
export default ConfiguracionSistemaListPage;
