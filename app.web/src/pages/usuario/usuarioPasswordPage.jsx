import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Badge, Field, Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { UsuarioService } from "../../services/usuarioService";
import {
  getUsuarioThemeStyles,
  useUsuarioStyles,
} from "../../styles/pages/usuario/usuarioPageStyles";
import { passwordChangeSchema } from "../../validations/formSchemas";
import { getReactHookFormErrorKey } from "../../validations/zodValidation";

function UsuarioPasswordPage() {
  const styles = useUsuarioStyles();
  const themeStyles = getUsuarioThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idUsuario = "" } = useParams();
  const { handleSubmit, register, reset } = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      confirmacionPassword: "",
    },
  });
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    UsuarioService.obtener(idUsuario)
      .then((data) => {
        if (isMounted) setUsuario(data);
      })
      .catch((loadError) => {
        if (isMounted) setError(loadError.message || t("userLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idUsuario, t]);

  const back = () => navigate("/usuario/listar");

  const save = async ({ password, confirmacionPassword }) => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await UsuarioService.cambiarPassword({
        idUsuario,
        password,
        confirmacionPassword,
      });
      setMessage(t("passwordChanged"));
      reset();
    } catch (saveError) {
      setError(saveError.message || t("passwordChangeError"));
    } finally {
      setSaving(false);
    }
  };

  const showValidationError = (errors) => {
    setError(t(getReactHookFormErrorKey(errors, "passwordMismatch")));
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("changePassword")}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.centeredFormWrap}>
        <div className={styles.passwordFormSurface} style={themeStyles.surface}>
          {loading ? (
            <div className={styles.loading}>
              <Spinner label={t("loadingUser")} />
            </div>
          ) : (
            <>
              <div className={styles.passwordUserInfo}>
                <div className={styles.cardField}>
                  <Text className={styles.metaLabel}>{t("userCode")}</Text>
                  <Text weight="semibold" className={styles.userCode}>
                    {usuario?.codUsuario}
                  </Text>
                </div>
                <div className={styles.cardField}>
                  <Text className={styles.metaLabel}>{t("userName")}</Text>
                  <Text className={styles.userName}>{usuario?.nombre}</Text>
                </div>
                <div className={styles.cardField}>
                  <Text className={styles.metaLabel}>{t("email")}</Text>
                  <Text className={styles.metaValue}>{usuario?.correo}</Text>
                </div>
                <div className={styles.cardField}>
                  <Text className={styles.metaLabel}>{t("status")}</Text>
                  <Badge appearance="tint" color={usuario?.estatus ? "success" : "danger"}>
                    {usuario?.estatus ? t("active") : t("inactive")}
                  </Badge>
                </div>
              </div>

              <form
                className={styles.verticalForm}
                onSubmit={handleSubmit(save, showValidationError)}
              >
                <Field label={t("newPassword")} required>
                  <Input type="password" {...register("password")} />
                </Field>
                <Field label={t("confirmPassword")} required>
                  <Input type="password" {...register("confirmacionPassword")} />
                </Field>
                <div className={styles.buttonRow}>
                  <ListActionButton
                    action="editar"
                    label={t("save")}
                    text={saving ? t("saving") : t("save")}
                    disabled={saving}
                    type="submit"
                  />
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default UsuarioPasswordPage;
