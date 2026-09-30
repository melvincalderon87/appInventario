export function getRedStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#bc3550" : "#4a111c",
    "--app-nav-border": isLight ? "#ef5b78" : "#651726",
    "--app-nav-foreground": isLight ? "#fff8fa" : "#ffe3ea",
    "--app-nav-shadow": isLight
      ? "0 1px 10px rgba(188, 53, 80, 0.22)"
      : "0 1px 10px rgba(0, 0, 0, 0.30)",
    "--app-nav-message-bg": isLight ? "#fff1f5" : "#651726",
    "--app-nav-message-color": isLight ? "#842033" : "#ffd3de",
    "--app-combo-bg": isLight ? "#ffffff" : "#7a1c2d",
    "--app-combo-border": isLight ? "#fec2d1" : "#a12a40",
    "--app-combo-fg": isLight ? "#842033" : "#fff1f5",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#842033",
    "--app-popover-border": isLight ? "#ffd3de" : "#a12a40",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(188, 53, 80, 0.12)"
      : "0 10px 24px rgba(0, 0, 0, 0.30)",
    "--app-field-label": isLight ? "#bc3550" : "#fb9ab0",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": isLight ? "#fff8fa" : "#ffe3ea",
    "--app-toggle-hover-bg": "#ffffff",
    "--app-toggle-hover-fg": "#bc3550",
    "--app-toggle-active-bg": "#ffe3ea",
    "--app-root-bg": isLight ? "#fff5f7" : "#3a0f18",
    "--app-sidebar-bg": isLight ? "#ffeaf0" : "#651726",
    "--app-sidebar-border": isLight ? "#ffd3de" : "#842033",
    "--app-user-label": isLight ? "#bc3550" : "#fb9ab0",
    "--app-user-value": isLight ? "#842033" : "#fff1f5",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#651726",
    "--app-card-bg": isLight ? "#ffffff" : "#7a1c2d",
    "--app-card-border": isLight ? "#ffd3de" : "#842033",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(188, 53, 80, 0.10)"
      : "0 10px 24px rgba(0, 0, 0, 0.28)",
    "--app-login-page-bg": isLight ? "#fff5f7" : "#3a0f18",
    "--app-login-card-bg": isLight ? "#ffffff" : "#7a1c2d",
    "--app-login-card-border": isLight ? "#ffd3de" : "#842033",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(188, 53, 80, 0.14)"
      : "0 18px 40px rgba(0, 0, 0, 0.30)",
    "--app-login-badge-bg": isLight ? "#ffe3ea" : "#a12a40",
    "--app-login-badge-fg": isLight ? "#bc3550" : "#fff1f5",
    "--app-login-title": isLight ? "#842033" : "#fff1f5",
    "--app-login-subtitle": isLight ? "#bc3550" : "#fdb0c3",
    "--app-login-button-bg": "#bc3550",
    "--app-login-button-hover-bg": "#a12a40",
    "--app-login-button-active-bg": "#842033",
    "--app-login-button-fg": "#ffffff",
    "--app-search-border": isLight ? "#ffd3de" : "#842033",
    "--app-search-bg": isLight ? "#fff9fa" : "#7a1c2d",
    "--app-search-fg": isLight ? "#bc3550" : "#ffe3ea",
    "--app-menu-active-fg": isLight ? "#842033" : "#fff1f5",
    "--app-menu-fg": isLight ? "#842033" : "#ffe3ea",
    "--app-menu-active-bg": isLight ? "#ffdfe8" : "#a12a40",
  };
}
