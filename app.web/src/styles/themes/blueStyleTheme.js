export function getBlueStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#0f6cbd" : "#17324d",
    "--app-nav-border": isLight ? "#5b9bd5" : "#244869",
    "--app-nav-foreground": "#f5f9ff",
    "--app-nav-shadow": isLight
      ? "0 1px 8px rgba(15, 108, 189, 0.18)"
      : "0 1px 10px rgba(0, 0, 0, 0.25)",
    "--app-nav-message-bg": isLight ? "#eef6fd" : "#10263c",
    "--app-nav-message-color": isLight ? "#17324d" : "#e2edf9",
    "--app-combo-bg": isLight ? "#ffffff" : "#1a3550",
    "--app-combo-border": isLight ? "#9ec5ea" : "#3d6288",
    "--app-combo-fg": isLight ? "#123252" : "#f5f9ff",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#123252",
    "--app-popover-border": isLight ? "#d9e8f7" : "#244869",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(15, 108, 189, 0.08)"
      : "0 10px 24px rgba(0, 0, 0, 0.24)",
    "--app-field-label": isLight ? "#4a6a86" : "#9db8d3",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": "#f5f9ff",
    "--app-toggle-hover-bg": "#ffffff",
    "--app-toggle-hover-fg": "#0f6cbd",
    "--app-toggle-active-bg": "#eaf3fb",
    "--app-root-bg": isLight ? "#f5f9fd" : "#0f1724",
    "--app-sidebar-bg": isLight ? "#eef6fd" : "#132235",
    "--app-sidebar-border": isLight ? "#d5e7f8" : "#223b58",
    "--app-user-label": isLight ? "#4a6a86" : "#9db8d3",
    "--app-user-value": isLight ? "#0f548c" : "#edf4fb",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#132235",
    "--app-card-bg": isLight ? "#ffffff" : "#162536",
    "--app-card-border": isLight ? "#d9e8f7" : "#24405f",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(15, 108, 189, 0.08)"
      : "0 10px 24px rgba(0, 0, 0, 0.24)",
    "--app-login-page-bg": isLight ? "#f5f9fd" : "#0f1724",
    "--app-login-card-bg": isLight ? "#ffffff" : "#162536",
    "--app-login-card-border": isLight ? "#d9e8f7" : "#24405f",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(15, 108, 189, 0.12)"
      : "0 18px 40px rgba(0, 0, 0, 0.28)",
    "--app-login-badge-bg": "#e6f2fb",
    "--app-login-badge-fg": "#0f6cbd",
    "--app-login-title": isLight ? "#123252" : "#f5f9ff",
    "--app-login-subtitle": isLight ? "#4a6a86" : "#a8bfd6",
    "--app-login-button-bg": "#0f6cbd",
    "--app-login-button-hover-bg": "#115ea3",
    "--app-login-button-active-bg": "#0c4f8a",
    "--app-login-button-fg": "#ffffff",
    "--app-search-border": isLight ? "#d5e7f8" : "#223b58",
    "--app-search-bg": isLight ? "#f7fbff" : "#132235",
    "--app-search-fg": isLight ? "#4a6a86" : "#edf4fb",
    "--app-menu-active-fg": isLight ? "#0f6cbd" : "#edf4fb",
    "--app-menu-fg": isLight ? "#123252" : "#d8e6f4",
    "--app-menu-active-bg": isLight ? "#e6f2fb" : "#1d3550",
  };
}
