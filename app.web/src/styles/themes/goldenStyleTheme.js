export function getGoldenStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#b88217" : "#4f3a0e",
    "--app-nav-border": isLight ? "#d7b15d" : "#73561a",
    "--app-nav-foreground": isLight ? "#fffaf0" : "#f9e7b0",
    "--app-nav-shadow": isLight
      ? "0 1px 10px rgba(184, 130, 23, 0.22)"
      : "0 1px 10px rgba(0, 0, 0, 0.28)",
    "--app-nav-message-bg": isLight ? "#fff7e6" : "#2e2410",
    "--app-nav-message-color": isLight ? "#5d430f" : "#f5d98b",
    "--app-combo-bg": isLight ? "#fffdf8" : "#3d2e12",
    "--app-combo-border": isLight ? "#e4cb90" : "#7c6223",
    "--app-combo-fg": isLight ? "#5b430f" : "#f6e5b0",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#5b430f",
    "--app-popover-border": isLight ? "#ead7ab" : "#6e541d",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(184, 130, 23, 0.14)"
      : "0 10px 24px rgba(0, 0, 0, 0.30)",
    "--app-field-label": isLight ? "#87672a" : "#d6be82",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": isLight ? "#fffaf0" : "#f9e7b0",
    "--app-toggle-hover-bg": "#fff8ea",
    "--app-toggle-hover-fg": "#9b6a10",
    "--app-toggle-active-bg": "#f7e8c4",
    "--app-root-bg": isLight ? "#fbf5e8" : "#181208",
    "--app-sidebar-bg": isLight ? "#f8eed7" : "#241b0c",
    "--app-sidebar-border": isLight ? "#e3cf9e" : "#5f4918",
    "--app-user-label": isLight ? "#87672a" : "#cfb77c",
    "--app-user-value": isLight ? "#9b6a10" : "#f5d98b",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#241b0c",
    "--app-card-bg": isLight ? "#fffdf8" : "#2a200e",
    "--app-card-border": isLight ? "#e8d8b0" : "#634c19",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(184, 130, 23, 0.12)"
      : "0 10px 24px rgba(0, 0, 0, 0.28)",
    "--app-login-page-bg": isLight ? "#fbf5e8" : "#181208",
    "--app-login-card-bg": isLight ? "#fffdf8" : "#2a200e",
    "--app-login-card-border": isLight ? "#e8d8b0" : "#634c19",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(184, 130, 23, 0.16)"
      : "0 18px 40px rgba(0, 0, 0, 0.30)",
    "--app-login-badge-bg": isLight ? "#f5ead0" : "#473410",
    "--app-login-badge-fg": isLight ? "#9b6a10" : "#f0d184",
    "--app-login-title": isLight ? "#5b430f" : "#fff2d2",
    "--app-login-subtitle": isLight ? "#87672a" : "#d4bb81",
    "--app-login-button-bg": "#b88217",
    "--app-login-button-hover-bg": "#9f7012",
    "--app-login-button-active-bg": "#82590e",
    "--app-login-button-fg": "#fffaf0",
    "--app-search-border": isLight ? "#e3cf9e" : "#5f4918",
    "--app-search-bg": isLight ? "#fffaf0" : "#2d220f",
    "--app-search-fg": isLight ? "#87672a" : "#f1d898",
    "--app-menu-active-fg": isLight ? "#9b6a10" : "#f7dda0",
    "--app-menu-fg": isLight ? "#5b430f" : "#ecd7a0",
    "--app-menu-active-bg": isLight ? "#f4e7c6" : "#463512",
  };
}
