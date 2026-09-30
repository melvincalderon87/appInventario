import { useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@/components/ui/app-shadcn";
import { useLocation, useNavigate } from "react-router-dom";
import AppRouter from "./routes/appRouter";
import { AppShellContext } from "./context/appShellContext";
import i18n from "./i18n";
import { LANGUAGES } from "./config/languages";
import { getAppStyleThemeVars } from "./styles/themes";
import { getDefaultThemeId, getAppThemeById, getAppThemes } from "./config/appThemes";
import ProtectedQueryProvider from "./lib/protectedQueryProvider";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedThemeId, setSelectedThemeId] = useState(
    () => getAppThemeById(localStorage.getItem("app-theme-id") ?? getDefaultThemeId()).id
  );
  const [locale, setLocale] = useState(() => localStorage.getItem("app-locale") ?? "es-GT");
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState("");
  const [userName, setUserName] = useState("");
  const isPublicRoute = location.pathname === "/";
  const currentTheme = getAppThemeById(selectedThemeId);
  const themeMode = currentTheme.mode;
  const appStyleVars = getAppStyleThemeVars(selectedThemeId, themeMode);
  const themeOptions = useMemo(() => getAppThemes(), []);

  useEffect(() => {
    localStorage.setItem("app-theme-id", selectedThemeId);
    localStorage.setItem("app-theme-mode", "light");
    document.documentElement.style.colorScheme = "light";
  }, [selectedThemeId]);

  useEffect(() => {
    localStorage.setItem("app-locale", locale);
    document.documentElement.lang = locale;
    i18n.changeLanguage(locale);
  }, [locale]);

  useEffect(() => {
    if (isPublicRoute) {
      setLanguageError("");
      return undefined;
    }

    let ignore = false;

    async function syncLanguage() {
      try {
        const [{ LanguageService }, { ThemeService }] = await Promise.all([
          import("./services/languageService"),
          import("./services/themeService"),
        ]);
        const [currentLocale, currentThemeId] = await Promise.all([
          LanguageService.getCurrentLanguage(),
          ThemeService.getCurrentTheme(),
        ]);
        if (!ignore) {
          setLocale(currentLocale);
          setSelectedThemeId(currentThemeId);
          setLanguageError("");
        }
      } catch (error) {
        if (!ignore) {
          if (error.message === "Sesion expirada") {
            setLanguageError("");
            navigate("/", { replace: true });
            return;
          }

          setLanguageError(error.message || i18n.t("getLanguageError"));
        }
      }
    }

    syncLanguage();

    return () => {
      ignore = true;
    };
  }, [isPublicRoute, navigate]);

  useEffect(() => {
    if (isPublicRoute) {
      setUserName("");
      return undefined;
    }

    let ignore = false;

    async function syncUser() {
      try {
        const { obtenerUsuario } = await import("./services/authService");
        const currentUser = await obtenerUsuario();
        if (!ignore) {
          setUserName(currentUser);
        }
      } catch (error) {
        if (!ignore) {
          if (error.message === "Sesion expirada") {
            navigate("/", { replace: true });
            return;
          }

          setUserName("");
        }
      }
    }

    syncUser();

    return () => {
      ignore = true;
    };
  }, [isPublicRoute, navigate]);

  const contextValue = useMemo(
    () => ({
      appTheme: currentTheme.theme,
      themeMode,
      selectedThemeId,
      themeOptions,
      locale,
      languageOptions: LANGUAGES,
      isChangingLanguage,
      languageError,
      userName,
      clearLanguageError: () => setLanguageError(""),
      setThemeById: async (nextThemeId) => {
        const nextTheme = getAppThemeById(nextThemeId);

        try {
          const { ThemeService } = await import("./services/themeService");
          const confirmedThemeId = await ThemeService.changeTheme(nextTheme.id);
          setSelectedThemeId(confirmedThemeId);
          setLanguageError("");
        } catch (error) {
          if (error.message === "Sesion expirada") {
            navigate("/", { replace: true });
            return;
          }

          setLanguageError(error.message || "No fue posible cambiar el tema.");
        }
      },
      changeLanguage: async (nextLocale) => {
        if (!nextLocale || nextLocale === locale) return;

        setIsChangingLanguage(true);
        try {
          const { LanguageService } = await import("./services/languageService");
          const confirmedLocale = await LanguageService.changeLanguage(nextLocale);
          setLocale(confirmedLocale);
          setLanguageError("");
        } catch (error) {
          setLanguageError(error.message || i18n.t("changeLanguageError"));
        } finally {
          setIsChangingLanguage(false);
        }
      },
    }),
    [
      currentTheme.theme,
      isChangingLanguage,
      languageError,
      locale,
      navigate,
      selectedThemeId,
      themeMode,
      themeOptions,
      userName,
    ]
  );

  const routedContent = (
    <ProtectedQueryProvider>
      <AppRouter />
    </ProtectedQueryProvider>
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <ThemeProvider theme={currentTheme.theme}>
        <div style={appStyleVars}>{routedContent}</div>
      </ThemeProvider>
    </AppShellContext.Provider>
  );
}
