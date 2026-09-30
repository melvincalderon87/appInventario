export function getBlackStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#2f2f2f" : "#0a0a0a",
    "--app-nav-border": isLight ? "#5d5d5d" : "#242424",
    "--app-nav-foreground": isLight ? "#fafafa" : "#f5f5f5",
    "--app-nav-shadow": isLight
      ? "0 1px 10px rgba(18, 18, 18, 0.28)"
      : "0 1px 10px rgba(0, 0, 0, 0.36)",
    "--app-nav-message-bg": isLight ? "#f1f1f1" : "#141414",
    "--app-nav-message-color": isLight ? "#1a1a1a" : "#ebebeb",
    "--app-combo-bg": isLight ? "#ffffff" : "#1a1a1a",
    "--app-combo-border": isLight ? "#cfcfcf" : "#3b3b3b",
    "--app-combo-fg": isLight ? "#1a1a1a" : "#f5f5f5",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#1a1a1a",
    "--app-popover-border": isLight ? "#d6d6d6" : "#3b3b3b",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(18, 18, 18, 0.16)"
      : "0 10px 24px rgba(0, 0, 0, 0.36)",
    "--app-field-label": isLight ? "#5d5d5d" : "#bdbdbd",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": isLight ? "#fafafa" : "#f5f5f5",
    "--app-toggle-hover-bg": "#ffffff",
    "--app-toggle-hover-fg": "#242424",
    "--app-toggle-active-bg": "#ebebeb",
    "--app-root-bg": isLight ? "#f5f5f5" : "#050505",
    "--app-sidebar-bg": isLight ? "#ebebeb" : "#121212",
    "--app-sidebar-border": isLight ? "#d6d6d6" : "#242424",
    "--app-user-label": isLight ? "#5d5d5d" : "#bdbdbd",
    "--app-user-value": isLight ? "#1a1a1a" : "#f5f5f5",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#121212",
    "--app-card-bg": isLight ? "#ffffff" : "#1a1a1a",
    "--app-card-border": isLight ? "#d6d6d6" : "#2f2f2f",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(18, 18, 18, 0.12)"
      : "0 10px 24px rgba(0, 0, 0, 0.34)",
    "--app-login-page-bg": isLight ? "#f5f5f5" : "#050505",
    "--app-login-card-bg": isLight ? "#ffffff" : "#1a1a1a",
    "--app-login-card-border": isLight ? "#d6d6d6" : "#2f2f2f",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(18, 18, 18, 0.16)"
      : "0 18px 40px rgba(0, 0, 0, 0.38)",
    "--app-login-badge-bg": isLight ? "#ededed" : "#2f2f2f",
    "--app-login-badge-fg": isLight ? "#242424" : "#f5f5f5",
    "--app-login-title": isLight ? "#1a1a1a" : "#f7f7f7",
    "--app-login-subtitle": isLight ? "#5d5d5d" : "#bdbdbd",
    "--app-login-button-bg": "#242424",
    "--app-login-button-hover-bg": "#1a1a1a",
    "--app-login-button-active-bg": "#121212",
    "--app-login-button-fg": "#ffffff",
    "--app-search-border": isLight ? "#d6d6d6" : "#242424",
    "--app-search-bg": isLight ? "#fafafa" : "#1a1a1a",
    "--app-search-fg": isLight ? "#5d5d5d" : "#d6d6d6",
    "--app-menu-active-fg": isLight ? "#1a1a1a" : "#ffffff",
    "--app-menu-fg": isLight ? "#1a1a1a" : "#d6d6d6",
    "--app-menu-active-bg": isLight ? "#e5e5e5" : "#2f2f2f",
  };
}
