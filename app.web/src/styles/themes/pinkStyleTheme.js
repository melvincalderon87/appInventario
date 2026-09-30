export function getPinkStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#c951a7" : "#4a183b",
    "--app-nav-border": isLight ? "#ef8ed2" : "#6f2958",
    "--app-nav-foreground": isLight ? "#fff8fc" : "#fde9f6",
    "--app-nav-shadow": isLight
      ? "0 1px 10px rgba(201, 81, 167, 0.22)"
      : "0 1px 10px rgba(0, 0, 0, 0.30)",
    "--app-nav-message-bg": isLight ? "#fff1f9" : "#5c214a",
    "--app-nav-message-color": isLight ? "#782c61" : "#fbdaf0",
    "--app-combo-bg": isLight ? "#ffffff" : "#6a2755",
    "--app-combo-border": isLight ? "#f7b7e3" : "#943778",
    "--app-combo-fg": isLight ? "#782c61" : "#fff5fb",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#782c61",
    "--app-popover-border": isLight ? "#f9c9ea" : "#943778",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(201, 81, 167, 0.12)"
      : "0 10px 24px rgba(0, 0, 0, 0.30)",
    "--app-field-label": isLight ? "#af4390" : "#f3a3db",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": isLight ? "#fff8fc" : "#fde9f6",
    "--app-toggle-hover-bg": "#ffffff",
    "--app-toggle-hover-fg": "#c951a7",
    "--app-toggle-active-bg": "#fde9f6",
    "--app-root-bg": isLight ? "#fff5fb" : "#3a1730",
    "--app-sidebar-bg": isLight ? "#fdeaf7" : "#5c214a",
    "--app-sidebar-border": isLight ? "#f8c9e8" : "#87336d",
    "--app-user-label": isLight ? "#af4390" : "#f3a3db",
    "--app-user-value": isLight ? "#782c61" : "#fff5fb",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#5c214a",
    "--app-card-bg": isLight ? "#ffffff" : "#6a2755",
    "--app-card-border": isLight ? "#f9c9ea" : "#87336d",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(201, 81, 167, 0.10)"
      : "0 10px 24px rgba(0, 0, 0, 0.28)",
    "--app-login-page-bg": isLight ? "#fff5fb" : "#3a1730",
    "--app-login-card-bg": isLight ? "#ffffff" : "#6a2755",
    "--app-login-card-border": isLight ? "#f9c9ea" : "#87336d",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(201, 81, 167, 0.14)"
      : "0 18px 40px rgba(0, 0, 0, 0.30)",
    "--app-login-badge-bg": isLight ? "#fde9f6" : "#87336d",
    "--app-login-badge-fg": isLight ? "#af4390" : "#fff5fb",
    "--app-login-title": isLight ? "#782c61" : "#fff5fb",
    "--app-login-subtitle": isLight ? "#af4390" : "#f7b7e3",
    "--app-login-button-bg": "#c951a7",
    "--app-login-button-hover-bg": "#af4390",
    "--app-login-button-active-bg": "#943778",
    "--app-login-button-fg": "#ffffff",
    "--app-search-border": isLight ? "#f8c9e8" : "#87336d",
    "--app-search-bg": isLight ? "#fff9fd" : "#6a2755",
    "--app-search-fg": isLight ? "#af4390" : "#fde9f6",
    "--app-menu-active-fg": isLight ? "#782c61" : "#fff5fb",
    "--app-menu-fg": isLight ? "#782c61" : "#fde9f6",
    "--app-menu-active-bg": isLight ? "#fde2f2" : "#87336d",
  };
}
