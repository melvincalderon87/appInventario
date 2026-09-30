import { useEffect, useMemo, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  Select,
  Spinner,
  Switch,
  Textarea,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateTimeInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { ConfiguracionCorreoService } from "../../services/configuracionCorreoService";
import {
  getConfiguracionCorreoActionPageThemeStyles,
  useConfiguracionCorreoActionPageStyles,
} from "../../styles/pages/configuracionCorreo/configuracionCorreoActionPageStyles";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";

const EMPTY_CONFIGURACION_CORREO = {
  idConfiguracionCorreo: "",
  codConfiguracionCorreo: 0,
  descripcion: "",
  direccionCorreo: "",
  nombreUsuario: "",
  password: "",
  proveedorAutenticacion: "SMTP",
  tipoAutenticacion: "Password",
  servidorSalida: "",
  puertoSalida: 0,
  sslSalida: false,
  tenantId: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  authorizationUrl: "",
  tokenUrl: "",
  scope: "",
  refreshToken: "",
  accessToken: "",
  fechaExpiracionToken: "",
  fechaUltimaAutenticacion: "",
  estatusAutenticacion: "Pendiente",
  ultimoErrorAutenticacion: "",
  estatus: true,
};

const SMTP_PROVIDER_DEFAULTS = {
  proveedorAutenticacion: "SMTP",
  tipoAutenticacion: "Password",
  password: "",
  servidorSalida: "",
  puertoSalida: 587,
  sslSalida: true,
  tenantId: "",
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  authorizationUrl: "",
  tokenUrl: "",
  scope: "",
  refreshToken: "",
  accessToken: "",
  fechaExpiracionToken: "",
  fechaUltimaAutenticacion: "",
  estatusAutenticacion: "Pendiente",
  ultimoErrorAutenticacion: "",
};

const AUTH_PROVIDER_DEFAULTS = {
  SMTP: SMTP_PROVIDER_DEFAULTS,
  Personalizado: SMTP_PROVIDER_DEFAULTS,
  Office365: {
    proveedorAutenticacion: "Office365",
    tipoAutenticacion: "OAuth2",
    password: "",
    servidorSalida: "smtp.office365.com",
    puertoSalida: 587,
    sslSalida: true,
    tenantId: "common",
    authorizationUrl: "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token",
    scope: "https://outlook.office365.com/SMTP.Send offline_access",
  },
  Gmail: {
    proveedorAutenticacion: "Gmail",
    tipoAutenticacion: "OAuth2",
    password: "",
    servidorSalida: "smtp.gmail.com",
    puertoSalida: 587,
    sslSalida: true,
    tenantId: "",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://mail.google.com/",
  },
};

function normalizeEmailProvider(value) {
  if (value === "Office365" || value === "Gmail") return value;
  return "SMTP";
}

function getEmailAuthType(provider) {
  return normalizeEmailProvider(provider) === "SMTP" ? "Password" : "OAuth2";
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);

  const pad = (part) => String(part).padStart(2, "0");
  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-") +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function ConfiguracionCorreoFormPage({ mode }) {
  const styles = useConfiguracionCorreoActionPageStyles();
  const themeStyles = getConfiguracionCorreoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idConfiguracionCorreo = "" } = useParams();
  const { values: configuracionCorreo, setValues: setConfiguracionCorreo } = useFormStateAdapter(
    EMPTY_CONFIGURACION_CORREO
  );
  const [loading, setLoading] = useState(mode !== "agregar");
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [singleLimitReached, setSingleLimitReached] = useState(false);

  const isAdd = mode === "agregar";
  const isView = mode === "visualizar";
  const isEdit = mode === "editar";
  const isDelete = mode === "eliminar";
  const canEditFields = (isAdd || isEdit) && !singleLimitReached;
  const selectedProvider = normalizeEmailProvider(configuracionCorreo.proveedorAutenticacion);
  const usesOAuth = selectedProvider !== "SMTP";
  const usesOffice365 = selectedProvider === "Office365";

  const titleKey = useMemo(
    () =>
      ({
        agregar: "emailConfigurationAddTitle",
        visualizar: "emailConfigurationViewTitle",
        editar: "emailConfigurationEditTitle",
        eliminar: "emailConfigurationDeleteTitle",
      })[mode] ?? "emailConfigurationAddTitle",
    [mode]
  );

  useEffect(() => {
    if (isAdd) {
      let isMounted = true;

      async function checkSingleConfiguration() {
        try {
          setLoading(true);
          setError("");
          const data = await ConfiguracionCorreoService.listado({
            page: 1,
            pageSize: 1,
            search: "",
            sort: "codConfiguracionCorreo:asc",
          });

          if (isMounted && data.totalCount > 0) {
            setSingleLimitReached(true);
            setError(t("emailConfigurationSingleLimitMessage"));
          }
        } catch (loadError) {
          if (isMounted) setError(loadError.message || t("emailConfigurationLoadError"));
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      checkSingleConfiguration();

      return () => {
        isMounted = false;
      };
    }

    let isMounted = true;

    async function loadConfiguracionCorreo() {
      try {
        setLoading(true);
        setError("");
        setSingleLimitReached(false);
        const data = await ConfiguracionCorreoService.obtener(idConfiguracionCorreo);
        if (isMounted) setConfiguracionCorreo({ ...EMPTY_CONFIGURACION_CORREO, ...data });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("emailConfigurationLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConfiguracionCorreo();

    return () => {
      isMounted = false;
    };
  }, [idConfiguracionCorreo, isAdd, setConfiguracionCorreo, t]);

  const updateField = (key) => (_, data) => {
    setConfiguracionCorreo((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setConfiguracionCorreo((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateProvider = (_, data) => {
    const provider = normalizeEmailProvider(data.value);
    const defaults = AUTH_PROVIDER_DEFAULTS[provider] ?? AUTH_PROVIDER_DEFAULTS.SMTP;

    setConfiguracionCorreo((current) => ({
      ...current,
      ...defaults,
      estatusAutenticacion: current.estatusAutenticacion || "Pendiente",
    }));
  };

  const updateSwitchField = (key) => (_, data) => {
    setConfiguracionCorreo((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const back = () => navigate("/configuracioncorreo/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/configuracioncorreo/editar",
      codpermiso: PERMISOS.editar,
    });

    if (response.authenticated === false) {
      navigate("/");
      return;
    }

    if (!response.authorized) {
      navigate("/inicio");
      return;
    }

    navigate(`/configuracioncorreo/editar/${encodeURIComponent(idConfiguracionCorreo)}`);
  };

  const buildPayload = () => {
    const provider = normalizeEmailProvider(configuracionCorreo.proveedorAutenticacion);
    const isOAuthProvider = provider !== "SMTP";

    return {
      ...configuracionCorreo,
      proveedorAutenticacion: provider,
      tipoAutenticacion: getEmailAuthType(provider),
      password: isOAuthProvider ? "" : configuracionCorreo.password,
      tenantId: isOAuthProvider ? configuracionCorreo.tenantId : "",
      clientId: isOAuthProvider ? configuracionCorreo.clientId : "",
      clientSecret: isOAuthProvider ? configuracionCorreo.clientSecret : "",
      redirectUri: isOAuthProvider ? configuracionCorreo.redirectUri : "",
      authorizationUrl: isOAuthProvider ? configuracionCorreo.authorizationUrl : "",
      tokenUrl: isOAuthProvider ? configuracionCorreo.tokenUrl : "",
      scope: isOAuthProvider ? configuracionCorreo.scope : "",
      refreshToken: isOAuthProvider ? configuracionCorreo.refreshToken : "",
      accessToken: isOAuthProvider ? configuracionCorreo.accessToken : "",
      fechaExpiracionToken: isOAuthProvider
        ? configuracionCorreo.fechaExpiracionToken || null
        : null,
      fechaUltimaAutenticacion: isOAuthProvider
        ? configuracionCorreo.fechaUltimaAutenticacion || null
        : null,
      estatusAutenticacion: isOAuthProvider
        ? configuracionCorreo.estatusAutenticacion || "Pendiente"
        : "Pendiente",
      ultimoErrorAutenticacion: isOAuthProvider ? configuracionCorreo.ultimoErrorAutenticacion : "",
      puertoSalida: toNumber(configuracionCorreo.puertoSalida),
      sslSalida: Boolean(configuracionCorreo.sslSalida),
      estatus: Boolean(configuracionCorreo.estatus),
    };
  };

  const save = async () => {
    if (singleLimitReached) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = buildPayload();

      if (
        !isDelete &&
        !setZodValidationError(formSchemas.configuracionCorreo, payload, t, setError).ok
      ) {
        return;
      }

      if (isAdd) {
        await ConfiguracionCorreoService.agregar(payload);
        setMessage(t("emailConfigurationAdded"));
        setConfiguracionCorreo({ ...EMPTY_CONFIGURACION_CORREO });
      }

      if (isEdit) {
        await ConfiguracionCorreoService.editar(payload);
        setMessage(t("emailConfigurationSaved"));
      }

      if (isDelete) {
        await ConfiguracionCorreoService.eliminar(payload);
        navigate("/configuracioncorreo/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("emailConfigurationSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t(titleKey)}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingEmailConfiguration")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteEmailConfigurationConfirmation", {
                  emailConfiguration: configuracionCorreo.descripcion,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("emailConfigurationCode")}>
                  <Input
                    value={String(configuracionCorreo.codConfiguracionCorreo ?? "")}
                    disabled
                  />
                </Field>
              ) : null}
              <Field label={t("emailConfigurationDescription")} required={canEditFields}>
                <Input
                  maxLength={100}
                  value={configuracionCorreo.descripcion ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("descripcion")}
                />
              </Field>
              <Field label={t("emailConfigurationEmailAddress")} required={canEditFields}>
                <Input
                  type="email"
                  maxLength={150}
                  value={configuracionCorreo.direccionCorreo ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("direccionCorreo")}
                />
              </Field>
              <Field label={t("emailConfigurationUserName")} required={canEditFields}>
                <Input
                  maxLength={150}
                  value={configuracionCorreo.nombreUsuario ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("nombreUsuario")}
                />
              </Field>
              <Field label={t("emailConfigurationPassword")} required={canEditFields && !usesOAuth}>
                <Input
                  type="password"
                  maxLength={50}
                  autoComplete="new-password"
                  value={configuracionCorreo.password ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("password")}
                />
              </Field>
              <Field label={t("emailConfigurationAuthProvider")} required={canEditFields}>
                <Select
                  value={selectedProvider}
                  disabled={!canEditFields}
                  onChange={updateProvider}
                >
                  <option value="SMTP">{t("emailConfigurationProviderSMTP")}</option>
                  <option value="Office365">{t("emailConfigurationProviderOffice365")}</option>
                  <option value="Gmail">{t("emailConfigurationProviderGmail")}</option>
                </Select>
              </Field>
              <Field label={t("emailConfigurationOutgoingServer")} required={canEditFields}>
                <Input
                  maxLength={150}
                  value={configuracionCorreo.servidorSalida ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("servidorSalida")}
                />
              </Field>
              <Field label={t("emailConfigurationOutgoingPort")} required={canEditFields}>
                <Input
                  type="number"
                  value={String(configuracionCorreo.puertoSalida ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("puertoSalida")}
                />
              </Field>
              {usesOAuth ? (
                <>
                  {usesOffice365 ? (
                    <Field label={t("emailConfigurationTenantId")} required={canEditFields}>
                      <Input
                        maxLength={150}
                        value={configuracionCorreo.tenantId ?? ""}
                        disabled={!canEditFields}
                        onChange={updateField("tenantId")}
                      />
                    </Field>
                  ) : null}
                  <Field label={t("emailConfigurationClientId")} required={canEditFields}>
                    <Input
                      maxLength={150}
                      value={configuracionCorreo.clientId ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("clientId")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationClientSecret")} required={canEditFields}>
                    <Input
                      type="password"
                      maxLength={250}
                      autoComplete="new-password"
                      value={configuracionCorreo.clientSecret ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("clientSecret")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationRedirectUri")}>
                    <Input
                      maxLength={250}
                      value={configuracionCorreo.redirectUri ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("redirectUri")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationAuthorizationUrl")} required={canEditFields}>
                    <Input
                      maxLength={500}
                      value={configuracionCorreo.authorizationUrl ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("authorizationUrl")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationTokenUrl")} required={canEditFields}>
                    <Input
                      maxLength={500}
                      value={configuracionCorreo.tokenUrl ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("tokenUrl")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationScope")} required={canEditFields}>
                    <Input
                      maxLength={500}
                      value={configuracionCorreo.scope ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("scope")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationRefreshToken")}>
                    <Textarea
                      rows={3}
                      value={configuracionCorreo.refreshToken ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("refreshToken")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationAccessToken")}>
                    <Textarea
                      rows={3}
                      value={configuracionCorreo.accessToken ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("accessToken")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationTokenExpiration")}>
                    <LocalizedDateTimeInput
                      value={toDateTimeLocal(configuracionCorreo.fechaExpiracionToken)}
                      disabled={!canEditFields}
                      onChange={updateField("fechaExpiracionToken")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationLastAuth")}>
                    <LocalizedDateTimeInput
                      value={toDateTimeLocal(configuracionCorreo.fechaUltimaAutenticacion)}
                      disabled={!canEditFields}
                      onChange={updateField("fechaUltimaAutenticacion")}
                    />
                  </Field>
                  <Field label={t("emailConfigurationAuthStatus")}>
                    <Select
                      value={configuracionCorreo.estatusAutenticacion ?? "Pendiente"}
                      disabled={!canEditFields}
                      onChange={updateField("estatusAutenticacion")}
                    >
                      <option value="Pendiente">{t("emailConfigurationAuthStatusPending")}</option>
                      <option value="Autenticado">
                        {t("emailConfigurationAuthStatusAuthenticated")}
                      </option>
                      <option value="Error">{t("emailConfigurationAuthStatusError")}</option>
                    </Select>
                  </Field>
                  <Field label={t("emailConfigurationLastAuthError")}>
                    <Textarea
                      rows={3}
                      maxLength={1000}
                      value={configuracionCorreo.ultimoErrorAutenticacion ?? ""}
                      disabled={!canEditFields}
                      onChange={updateField("ultimoErrorAutenticacion")}
                    />
                  </Field>
                </>
              ) : null}
              <Field label={t("emailConfigurationOutgoingSsl")}>
                <Switch
                  checked={Boolean(configuracionCorreo.sslSalida)}
                  disabled={!canEditFields}
                  label={configuracionCorreo.sslSalida ? t("yes") : t("no")}
                  onChange={updateSwitchField("sslSalida")}
                />
              </Field>
              <Field label={t("emailConfigurationStatus")}>
                <Switch
                  checked={Boolean(configuracionCorreo.estatus)}
                  disabled={!canEditFields}
                  label={configuracionCorreo.estatus ? t("active") : t("inactive")}
                  onChange={updateSwitchField("estatus")}
                />
              </Field>
            </div>

            <div className={styles.buttonRow}>
              {isView ? (
                <ListActionButton
                  action="editar"
                  label={t("edit")}
                  text={t("edit")}
                  onClick={goEdit}
                />
              ) : null}
              {isAdd ? (
                <ListActionButton
                  action="agregar"
                  label={t("add")}
                  text={saving ? t("saving") : t("add")}
                  disabled={saving || singleLimitReached}
                  onClick={save}
                />
              ) : null}
              {isEdit ? (
                <ListActionButton
                  action="editar"
                  label={t("save")}
                  text={saving ? t("saving") : t("save")}
                  disabled={saving}
                  onClick={save}
                />
              ) : null}
              {isDelete ? (
                <ListActionButton
                  action="eliminar"
                  label={t("confirmDelete")}
                  text={saving ? t("deleting") : t("confirmDelete")}
                  disabled={saving}
                  onClick={() => setOpenDeleteConfirm(true)}
                />
              ) : null}
            </div>
          </>
        )}
      </div>

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>
              {t("deleteEmailConfigurationConfirmation", {
                emailConfiguration: configuracionCorreo.descripcion,
              })}
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label={t("back")}
                text={t("back")}
                onClick={() => setOpenDeleteConfirm(false)}
              />
              <ListActionButton
                action="eliminar"
                label={t("confirmDelete")}
                text={saving ? t("deleting") : t("confirmDelete")}
                disabled={saving}
                onClick={confirmDelete}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default ConfiguracionCorreoFormPage;
