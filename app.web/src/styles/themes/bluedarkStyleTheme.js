export function getBlueDarkStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#1e5a8a" : "#0f2236",
    "--app-nav-border": isLight ? "#4d89b8" : "#21425f",
    "--app-nav-foreground": isLight ? "#f7fbff" : "#e7f1f8",
    "--app-nav-shadow": isLight
      ? "0 1px 10px rgba(30, 90, 138, 0.22)"
      : "0 1px 10px rgba(0, 0, 0, 0.30)",
    "--app-nav-message-bg": isLight ? "#eef5fb" : "#12283d",
    "--app-nav-message-color": isLight ? "#17324d" : "#d7e6f3",
    "--app-combo-bg": isLight ? "#ffffff" : "#173148",
    "--app-combo-border": isLight ? "#a8c5dc" : "#315370",
    "--app-combo-fg": isLight ? "#17324d" : "#edf5fb",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#17324d",
    "--app-popover-border": isLight ? "#d6e5f0" : "#315370",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(30, 90, 138, 0.12)"
      : "0 10px 24px rgba(0, 0, 0, 0.30)",
    "--app-field-label": isLight ? "#5a7690" : "#b7cedf",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": isLight ? "#f7fbff" : "#e7f1f8",
    "--app-toggle-hover-bg": "#ffffff",
    "--app-toggle-hover-fg": "#1e5a8a",
    "--app-toggle-active-bg": "#e4eef7",
    "--app-root-bg": isLight ? "#f3f7fb" : "#0d1823",
    "--app-sidebar-bg": isLight ? "#eef5fb" : "#12283d",
    "--app-sidebar-border": isLight ? "#d6e5f0" : "#27435d",
    "--app-user-label": isLight ? "#5a7690" : "#b7cedf",
    "--app-user-value": isLight ? "#1e5a8a" : "#edf5fb",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#12283d",
    "--app-card-bg": isLight ? "#ffffff" : "#162b3e",
    "--app-card-border": isLight ? "#d6e5f0" : "#27435d",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(30, 90, 138, 0.10)"
      : "0 10px 24px rgba(0, 0, 0, 0.28)",
    "--app-login-page-bg": isLight ? "#f3f7fb" : "#0d1823",
    "--app-login-card-bg": isLight ? "#ffffff" : "#162b3e",
    "--app-login-card-border": isLight ? "#d6e5f0" : "#27435d",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(30, 90, 138, 0.14)"
      : "0 18px 40px rgba(0, 0, 0, 0.30)",
    "--app-login-badge-bg": isLight ? "#e7f0f8" : "#24435f",
    "--app-login-badge-fg": isLight ? "#1e5a8a" : "#dcebf7",
    "--app-login-title": isLight ? "#17324d" : "#edf5fb",
    "--app-login-subtitle": isLight ? "#5a7690" : "#b7cedf",
    "--app-login-button-bg": "#1e5a8a",
    "--app-login-button-hover-bg": "#194d75",
    "--app-login-button-active-bg": "#143e5e",
    "--app-login-button-fg": "#ffffff",
    "--app-search-border": isLight ? "#d6e5f0" : "#27435d",
    "--app-search-bg": isLight ? "#f8fbfe" : "#173148",
    "--app-search-fg": isLight ? "#5a7690" : "#d7e6f3",
    "--app-menu-active-fg": isLight ? "#1e5a8a" : "#edf5fb",
    "--app-menu-fg": isLight ? "#17324d" : "#d7e6f3",
    "--app-menu-active-bg": isLight ? "#e7f0f8" : "#1b3953",
  };
}
