export function getGreenStyleThemeVars(themeMode) {
  const isLight = themeMode === "light";

  return {
    "--app-nav-bg": isLight ? "#2a8758" : "#123728",
    "--app-nav-border": isLight ? "#72cd9d" : "#21533e",
    "--app-nav-foreground": isLight ? "#f6fdf8" : "#e8f7ee",
    "--app-nav-shadow": isLight
      ? "0 1px 10px rgba(42, 135, 88, 0.22)"
      : "0 1px 10px rgba(0, 0, 0, 0.30)",
    "--app-nav-message-bg": isLight ? "#eefaf2" : "#163e2d",
    "--app-nav-message-color": isLight ? "#19593a" : "#d1f0df",
    "--app-combo-bg": isLight ? "#ffffff" : "#184631",
    "--app-combo-border": isLight ? "#bbe8d1" : "#2d6a4e",
    "--app-combo-fg": isLight ? "#19593a" : "#e8f7ee",
    "--app-popover-bg": "#ffffff",
    "--app-popover-fg": "#19593a",
    "--app-popover-border": isLight ? "#d1f0df" : "#2d6a4e",
    "--app-popover-shadow": isLight
      ? "0 10px 24px rgba(42, 135, 88, 0.12)"
      : "0 10px 24px rgba(0, 0, 0, 0.30)",
    "--app-field-label": isLight ? "#359d67" : "#a3e0c1",
    "--app-flag-shadow": "0 0 0 1px rgba(0, 0, 0, 0.08)",
    "--app-logout-bg": "#c4314b",
    "--app-logout-hover-bg": "#a6263d",
    "--app-logout-active-bg": "#861f32",
    "--app-logout-fg": "#ffffff",
    "--app-toggle-fg": isLight ? "#f6fdf8" : "#e8f7ee",
    "--app-toggle-hover-bg": "#ffffff",
    "--app-toggle-hover-fg": "#2a8758",
    "--app-toggle-active-bg": "#e5f7ec",
    "--app-root-bg": isLight ? "#f4fcf7" : "#10271d",
    "--app-sidebar-bg": isLight ? "#eaf9f0" : "#163e2d",
    "--app-sidebar-border": isLight ? "#cdeedc" : "#28533f",
    "--app-user-label": isLight ? "#359d67" : "#a3e0c1",
    "--app-user-value": isLight ? "#19593a" : "#e8f7ee",
    "--app-user-strip-bg": isLight ? "#ffffff" : "#163e2d",
    "--app-card-bg": isLight ? "#ffffff" : "#194631",
    "--app-card-border": isLight ? "#d1f0df" : "#28533f",
    "--app-card-shadow": isLight
      ? "0 10px 24px rgba(42, 135, 88, 0.10)"
      : "0 10px 24px rgba(0, 0, 0, 0.28)",
    "--app-login-page-bg": isLight ? "#f4fcf7" : "#10271d",
    "--app-login-card-bg": isLight ? "#ffffff" : "#194631",
    "--app-login-card-border": isLight ? "#d1f0df" : "#28533f",
    "--app-login-card-shadow": isLight
      ? "0 18px 40px rgba(42, 135, 88, 0.14)"
      : "0 18px 40px rgba(0, 0, 0, 0.30)",
    "--app-login-badge-bg": isLight ? "#e5f7ec" : "#28533f",
    "--app-login-badge-fg": isLight ? "#2a8758" : "#d1f0df",
    "--app-login-title": isLight ? "#19593a" : "#e8f7ee",
    "--app-login-subtitle": isLight ? "#359d67" : "#a3e0c1",
    "--app-login-button-bg": "#2a8758",
    "--app-login-button-hover-bg": "#207048",
    "--app-login-button-active-bg": "#19593a",
    "--app-login-button-fg": "#ffffff",
    "--app-search-border": isLight ? "#cdeedc" : "#28533f",
    "--app-search-bg": isLight ? "#f8fdf9" : "#184631",
    "--app-search-fg": isLight ? "#359d67" : "#d1f0df",
    "--app-menu-active-fg": isLight ? "#19593a" : "#f4fcf7",
    "--app-menu-fg": isLight ? "#19593a" : "#d1f0df",
    "--app-menu-active-bg": isLight ? "#dff4e8" : "#21533e",
  };
}
