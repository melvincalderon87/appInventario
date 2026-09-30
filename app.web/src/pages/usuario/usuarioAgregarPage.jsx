import { useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import { Checkbox, Field, Input, MessageBar, Title2 } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { UsuarioService } from "../../services/usuarioService";
import {
  getUsuarioActionPageThemeStyles,
  useUsuarioActionPageStyles,
} from "../../styles/pages/usuario/usuarioActionPageStyles";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";

const EMPTY_USUARIO = {
  idUsuario: "",
  codUsuario: "",
  nombre: "",
  correo: "",
  password: "",
  confirmacionPassword: "",
  estatus: true,
};

function UsuarioAgregarPage() {
  const styles = useUsuarioActionPageStyles();
  const themeStyles = getUsuarioActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { values: usuario, setValues: setUsuario } = useFormStateAdapter(EMPTY_USUARIO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const updateField = (key) => (_, data) => {
    setUsuario((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateStatus = (_, data) => {
    setUsuario((current) => ({
      ...current,
      estatus: data.checked === true,
    }));
  };

  const back = () => navigate("/usuario/listar");

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.usuario, usuario, t, setError).ok) return;

      await UsuarioService.agregar(usuario);
      setMessage(t("userAdded"));
      setUsuario({ ...EMPTY_USUARIO });
    } catch (saveError) {
      setError(saveError.message || t("userSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("userAddTitle")}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        <div className={styles.formGrid}>
          <Field label={t("userCode")} required>
            <Input value={usuario.codUsuario ?? ""} onChange={updateField("codUsuario")} />
          </Field>
          <Field label={t("userName")} required>
            <Input value={usuario.nombre ?? ""} onChange={updateField("nombre")} />
          </Field>
          <Field label={t("email")} required>
            <Input value={usuario.correo ?? ""} onChange={updateField("correo")} />
          </Field>
          <Field label={t("newPassword")} required>
            <Input
              type="password"
              value={usuario.password ?? ""}
              onChange={updateField("password")}
            />
          </Field>
          <Field label={t("confirmPassword")} required>
            <Input
              type="password"
              value={usuario.confirmacionPassword ?? ""}
              onChange={updateField("confirmacionPassword")}
            />
          </Field>
          <Field label={t("status")}>
            <Checkbox
              checked={usuario.estatus === true}
              onChange={updateStatus}
              label={usuario.estatus ? t("active") : t("inactive")}
            />
          </Field>
        </div>

        <div className={styles.buttonRow}>
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={saving ? t("saving") : t("add")}
            disabled={saving}
            onClick={save}
          />
        </div>
      </div>
    </section>
  );
}

export default UsuarioAgregarPage;
