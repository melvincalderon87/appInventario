import {
  Button,
  Combobox,
  MessageBar,
  Option,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Text,
} from "@/components/ui/app-shadcn";
import { useEffect, useState } from "react";
import { House, LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppShell } from "../context/appShellContext";
import { logout } from "../services/authService";
import { AutorizacionCombustibleService } from "../services/autorizacionCombustibleService";
import { getTopNavThemeStyles, useTopNavBarStyles } from "../styles/components/topNavBarStyles";

export function TopNavBar({ navOpen, onToggleNav }) {
  const styles = useTopNavBarStyles();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [documentosPendientes, setDocumentosPendientes] = useState(0);
  const {
    locale,
    themeMode,
    selectedThemeId,
    themeOptions,
    setThemeById,
    languageOptions,
    changeLanguage,
    isChangingLanguage,
    languageError,
    clearLanguageError,
  } = useAppShell();

  const getThemeFamily = (themeId) => String(themeId ?? "").replace(/-(light|dark)$/i, "");

  const currentLanguage =
    languageOptions.find((item) => item.code === locale) ?? languageOptions[0];
  const selectedThemeOption =
    themeOptions.find((item) => getThemeFamily(selectedThemeId) === getThemeFamily(item.id)) ??
    themeOptions[0];
  const themeStyles = getTopNavThemeStyles(selectedThemeId, themeMode);
  const dropdownPositioning = {
    position: "below",
    offset: { mainAxis: 8 },
  };
  const userMenuPositioning = {
    position: "below-end",
    align: "end",
    offset: { mainAxis: 8, crossAxis: -12 },
    overflowBoundaryPadding: 12,
    pinned: true,
    strategy: "fixed",
    useTransform: false,
  };

  useEffect(() => {
    let activo = true;
    AutorizacionCombustibleService.pendientes()
      .then((documentos) => {
        if (activo) setDocumentosPendientes(Array.isArray(documentos) ? documentos.length : 0);
      })
      .catch(() => {
        if (activo) setDocumentosPendientes(0);
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const handleLanguageSelect = async (_, data) => {
    const nextLocale = data.optionValue ?? data.selectedOptions?.[0];

    if (nextLocale) {
      await changeLanguage(nextLocale);
    }
  };

  return (
    <header className={styles.root} style={themeStyles.navRoot}>
      <div className={styles.bar}>
        <div className={styles.group}>
          <Button
            appearance="subtle"
            icon={<span className={styles.menuIcon} aria-hidden="true" />}
            onClick={onToggleNav}
            aria-label={navOpen ? t("hideMenu") : t("showMenu")}
            style={themeStyles.navButton}
          />

          <Button
            appearance="transparent"
            icon={<House />}
            className={styles.titleButton}
            onClick={() => navigate("/inicio")}
            style={themeStyles.navButton}
          >
            {t("appTitle")}
          </Button>
        </div>

        <div className={styles.grow} />

        <div className={styles.group}>
          {documentosPendientes > 0 ? (
            <Button
              appearance="subtle"
              className={styles.authorizationAlertButton}
              onClick={() => navigate("/gestion/autorizaciones-pendientes")}
              aria-label={`${documentosPendientes} documentos pendientes de autorizar`}
              title={`${documentosPendientes} documento(s) pendiente(s) de autorizar`}
              style={themeStyles.authorizationAlertButton}
            >
              Autorización
              <span className={styles.authorizationBadge}>{documentosPendientes}</span>
            </Button>
          ) : null}

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
              className={styles.combo}
              selectedOptions={currentLanguage ? [currentLanguage.code] : []}
              value={currentLanguage?.label ?? ""}
              disabled={isChangingLanguage}
              positioning={dropdownPositioning}
              onOptionSelect={handleLanguageSelect}
              aria-label={t("language")}
              style={themeStyles.combo}
            >
              {languageOptions.map((language) => (
                <Option key={language.code} value={language.code} text={language.label}>
                  <div className={styles.optionContent}>
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

          <Button
            appearance="primary"
            icon={<LogOut />}
            onClick={handleLogout}
            className={styles.logoutButton}
            style={themeStyles.logoutButton}
          >
            {t("logout")}
          </Button>

          <Popover
            open={userMenuOpen}
            onOpenChange={(_, data) => setUserMenuOpen(data.open)}
            positioning={userMenuPositioning}
          >
            <PopoverTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<User />}
                className={styles.userButton}
                aria-label={t("userMenu")}
                style={themeStyles.navButton}
              />
            </PopoverTrigger>

            <PopoverSurface className={styles.userPopover} style={themeStyles.userPopover}>
              <Text className={styles.menuTitle} style={themeStyles.menuTitle}>
                {t("userMenu")}
              </Text>

              <div className={styles.menuSection}>
                <Text className={styles.fieldLabel} style={themeStyles.fieldLabel}>
                  {t("theme")}
                </Text>
                <Combobox
                  className={styles.themeCombo}
                  selectedOptions={selectedThemeOption ? [selectedThemeOption.id] : []}
                  value={selectedThemeOption?.label ?? ""}
                  style={themeStyles.themeCombo}
                  positioning={dropdownPositioning}
                  onOptionSelect={async (_, data) => {
                    const nextThemeId = data.optionValue ?? data.selectedOptions?.[0];

                    if (nextThemeId) {
                      await setThemeById(nextThemeId);
                    }
                  }}
                  aria-label={t("theme")}
                >
                  {themeOptions.map((themeOption) => (
                    <Option key={themeOption.id} value={themeOption.id} text={themeOption.label}>
                      {themeOption.label}
                    </Option>
                  ))}
                </Combobox>
              </div>

              <Button
                appearance="primary"
                icon={<LogOut />}
                onClick={handleLogout}
                className={`${styles.logoutButton} ${styles.menuLogoutButton}`}
                style={themeStyles.logoutButton}
              >
                {t("logout")}
              </Button>
            </PopoverSurface>
          </Popover>
        </div>
      </div>

      {languageError ? (
        <MessageBar
          intent="error"
          className={styles.message}
          onDismiss={clearLanguageError}
          style={themeStyles.message}
        >
          {languageError}
        </MessageBar>
      ) : null}
    </header>
  );
}
