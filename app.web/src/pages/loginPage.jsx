import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Combobox,
  Field,
  Input,
  MessageBar,
  Option,
  Text,
  Title1,
} from "@/components/ui/app-shadcn";
import { getLoginPageThemeStyles, useLoginPageStyles } from "../styles/pages/login/loginPageStyles";
import { loginFormSchema, validateLoginPayload } from "../utils/validateInputSQL";
import { getReactHookFormErrorKey } from "../validations/zodValidation";
import { useAppShell } from "../context/appShellContext";

function LoginPage() {
  const styles = useLoginPageStyles();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale, languageOptions, changeLanguage, isChangingLanguage } = useAppShell();
  const { handleSubmit, register } = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      codUsuario: "",
      password: "",
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const currentLanguage =
    languageOptions.find((item) => item.code === locale) ?? languageOptions[0];
  const themeStyles = getLoginPageThemeStyles();

  const submitLogin = async (formValues) => {
    setError("");

    const validation = validateLoginPayload({
      codUsuario: formValues.codUsuario,
      password: formValues.password,
    });

    if (!validation.ok) {
      setError(t(validation.errorKey));
      return;
    }

    try {
      setLoading(true);
      const { login } = await import("../services/authService");

      const response = await login({
        codUsuario: validation.sanitized.codUsuario,
        password: validation.sanitized.password,
      });

      if (response?.ok === true) {
        navigate("/inicio");
        return;
      }

      setError(response?.message || t("invalidCredentials"));
    } catch (submitError) {
      setError(submitError.message || t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  const showValidationError = (errors) => {
    setError(t(getReactHookFormErrorKey(errors)));
  };

  return (
    <div className={styles.page} style={themeStyles.page}>
      <Card className={styles.card} style={themeStyles.card}>
        <div className={styles.languageBar}>
          <div className={styles.languageSelector}>
            {currentLanguage ? (
              <img
                src={currentLanguage.bandera}
                alt=""
                aria-hidden="true"
                className={`${styles.flag} ${styles.selectedFlag}`}
                style={themeStyles.flag}
              />
            ) : null}

            <Combobox
              className={styles.languageCombo}
              selectedOptions={currentLanguage ? [currentLanguage.code] : []}
              value={currentLanguage?.label ?? ""}
              disabled={isChangingLanguage}
              onOptionSelect={async (_, data) => {
                const nextLocale = data.optionValue ?? data.selectedOptions?.[0];

                if (nextLocale) {
                  await changeLanguage(nextLocale);
                }
              }}
              aria-label={t("language")}
            >
              {languageOptions.map((language) => (
                <Option key={language.code} value={language.code} text={language.label}>
                  <div className={styles.languageOption}>
                    <img
                      src={language.bandera}
                      alt={language.label}
                      className={styles.flag}
                      style={themeStyles.flag}
                    />
                    <Text>{language.label}</Text>
                  </div>
                </Option>
              ))}
            </Combobox>
          </div>
        </div>

        <div className={styles.hero}>
          <div className={styles.badge} style={themeStyles.badge}>
            {t("appTitle")}
          </div>
          <Title1 className={styles.title} style={themeStyles.title}>
            {t("loginTitle")}
          </Title1>
          <Text className={styles.subtitle} style={themeStyles.subtitle}>
            {t("loginSubtitle")}
          </Text>
        </div>

        {error && <MessageBar intent="error">{error}</MessageBar>}

        <form onSubmit={handleSubmit(submitLogin, showValidationError)} className={styles.form}>
          <Field label={t("userCode")} required>
            <Input {...register("codUsuario")} />
          </Field>

          <div className={styles.formGroup}>
            <Field label={t("password")} required>
              <Input type="password" {...register("password")} />
            </Field>
          </div>

          <Button
            type="submit"
            appearance="primary"
            className={styles.button}
            style={themeStyles.button}
            disabled={loading}
          >
            {loading ? t("loadingLogin") : t("submitLogin")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
