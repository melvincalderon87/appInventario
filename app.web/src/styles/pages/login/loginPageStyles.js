import { makeStyles } from "@/components/ui/app-shadcn";

export const useLoginPageStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "34px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    borderRadius: "18px",
  },
  languageBar: {
    display: "flex",
    justifyContent: "flex-end",
  },
  languageSelector: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "100%",
  },
  languageCombo: {
    minWidth: "180px",
    fontSize: "0.9rem",
  },
  languageOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  flag: {
    width: "18px",
    height: "12px",
    objectFit: "cover",
    borderRadius: "2px",
  },
  selectedFlag: {
    flexShrink: 0,
    pointerEvents: "none",
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "0.78rem",
    fontWeight: "700",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  title: {},
  subtitle: {
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginTop: "12px",
  },
  button: {
    marginTop: "20px",
    width: "100%",
    minHeight: "42px",
    ":hover": {
      backgroundColor: "var(--login-button-hover-bg)",
      borderColor: "var(--login-button-hover-border)",
    },
    ":active": {
      backgroundColor: "var(--login-button-active-bg)",
      borderColor: "var(--login-button-active-border)",
    },
  },
});

export function getLoginPageThemeStyles() {
  return {
    page: {
      backgroundColor: "var(--app-login-page-bg)",
    },
    card: {
      backgroundColor: "var(--app-login-card-bg)",
      border: "1px solid var(--app-login-card-border)",
      boxShadow: "var(--app-login-card-shadow)",
    },
    flag: {
      boxShadow: "var(--app-flag-shadow)",
    },
    badge: {
      backgroundColor: "var(--app-login-badge-bg)",
      color: "var(--app-login-badge-fg)",
    },
    title: {
      color: "var(--app-login-title)",
    },
    subtitle: {
      color: "var(--app-login-subtitle)",
    },
    button: {
      backgroundColor: "var(--app-login-button-bg)",
      borderColor: "var(--app-login-button-bg)",
      color: "var(--app-login-button-fg)",
      "--login-button-hover-bg": "var(--app-login-button-hover-bg)",
      "--login-button-hover-border": "var(--app-login-button-hover-bg)",
      "--login-button-active-bg": "var(--app-login-button-active-bg)",
      "--login-button-active-border": "var(--app-login-button-active-bg)",
    },
  };
}
