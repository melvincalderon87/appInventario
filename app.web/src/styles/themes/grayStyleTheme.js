export function getGrayStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#5f5f5f" : "#242424",
    "--app-nav-border": isLight ? "#8a8a8a" : "#3c3c3c",
    "--app-nav-foreground": isLight ? "#fafafa" : "#f5f5f5",
    "--app-nav-shadow": isLight
      ? "0 1px 10px rgba(95, 95, 95, 0.20)"
      : "0 1px 10px rgba(0, 0, 0, 0.30)",
    "--app-nav-message-bg": isLight ? "#f3f3f3" : "#2b2b2b",
    "--app-nav-message-color": isLight ? "#2d2d2d" : "#e5e5e5",
    "--app-combo-bg": isLight ? "#ffffff" : "#323232",
    "--app-combo-border": isLight ? "#c9c9c9" : "#4b4b4b",
    "--app-combo-fg": isLight ? "#2d2d2d" : "#f1f1f1",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#2d2d2d",
    "--app-popover-border": isLight ? "#d8d8d8" : "#5b5b5b",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(95, 95, 95, 0.12)"
      : "0 10px 24px rgba(0, 0, 0, 0.30)",
    "--app-field-label": isLight ? "#6d6d6d" : "#c9c9c9",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": isLight ? "#fafafa" : "#f5f5f5",
    "--app-toggle-hover-bg": "#ffffff",
    "--app-toggle-hover-fg": "#4b4b4b",
    "--app-toggle-active-bg": "#ececec",
    "--app-root-bg": isLight ? "#f7f7f7" : "#1f1f1f",
    "--app-sidebar-bg": isLight ? "#efefef" : "#2b2b2b",
    "--app-sidebar-border": isLight ? "#d8d8d8" : "#444444",
    "--app-user-label": isLight ? "#6d6d6d" : "#c9c9c9",
    "--app-user-value": isLight ? "#3c3c3c" : "#f1f1f1",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#2b2b2b",
    "--app-card-bg": isLight ? "#ffffff" : "#303030",
    "--app-card-border": isLight ? "#dddddd" : "#444444",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(95, 95, 95, 0.10)"
      : "0 10px 24px rgba(0, 0, 0, 0.28)",
    "--app-login-page-bg": isLight ? "#f7f7f7" : "#1f1f1f",
    "--app-login-card-bg": isLight ? "#ffffff" : "#303030",
    "--app-login-card-border": isLight ? "#dddddd" : "#444444",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(95, 95, 95, 0.14)"
      : "0 18px 40px rgba(0, 0, 0, 0.30)",
    "--app-login-badge-bg": isLight ? "#efefef" : "#444444",
    "--app-login-badge-fg": isLight ? "#4b4b4b" : "#f1f1f1",
    "--app-login-title": isLight ? "#2d2d2d" : "#f5f5f5",
    "--app-login-subtitle": isLight ? "#6d6d6d" : "#c9c9c9",
    "--app-login-button-bg": "#5f5f5f",
    "--app-login-button-hover-bg": "#4b4b4b",
    "--app-login-button-active-bg": "#3c3c3c",
    "--app-login-button-fg": "#ffffff",
    "--app-search-border": isLight ? "#d8d8d8" : "#444444",
    "--app-search-bg": isLight ? "#fafafa" : "#323232",
    "--app-search-fg": isLight ? "#6d6d6d" : "#e5e5e5",
    "--app-menu-active-fg": isLight ? "#3c3c3c" : "#fafafa",
    "--app-menu-fg": isLight ? "#2d2d2d" : "#e5e5e5",
    "--app-menu-active-bg": isLight ? "#e8e8e8" : "#3c3c3c",
  };
}
