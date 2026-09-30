import { makeStyles } from "@/components/ui/app-shadcn";
import { assetUrl } from "../../utils/assets";

const menuIconUrl = assetUrl("images/menu.svg");

export const useTopNavBarStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  bar: {
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "0 14px",
    width: "100%",
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  titleButton: {
    fontSize: "0.98rem",
    fontWeight: "700",
  },
  menuIcon: {
    width: "20px",
    height: "20px",
    display: "block",
    backgroundColor: "currentColor",
    maskImage: `url("${menuIconUrl}")`,
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskImage: `url("${menuIconUrl}")`,
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
  },
  languageSelector: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },
  combo: {
    minWidth: "178px",
    fontSize: "0.9rem",
    paddingLeft: "36px",
  },
  themeCombo: {
    minWidth: "178px",
    fontSize: "0.9rem",
  },
  optionContent: {
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
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  authorizationAlertButton: {
    position: "relative",
    minWidth: "112px",
    height: "36px",
    padding: "0 22px 0 10px",
    fontSize: "0.88rem",
    fontWeight: "600",
  },
  authorizationBadge: {
    position: "absolute",
    top: "1px",
    right: "1px",
    minWidth: "16px",
    height: "16px",
    padding: "0 4px",
    boxSizing: "border-box",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.66rem",
    fontWeight: "700",
    lineHeight: 1,
    color: "#ffffff",
    backgroundColor: "#17324d",
    border: "1px solid #f6b73c",
  },
  grow: {
    flex: 1,
  },
  userButton: {
    minWidth: "36px",
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    padding: 0,
  },
  userPopover: {
    width: "268px",
    maxWidth: "calc(100vw - 24px)",
    padding: "14px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    zIndex: 1000,
  },
  menuTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--app-menu-fg)",
  },
  menuSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  menuActionButton: {
    width: "100%",
    justifyContent: "flex-start",
  },
  fieldLabel: {
    fontSize: "0.78rem",
    fontWeight: "600",
    opacity: 0.85,
    color: "var(--app-menu-fg)",
  },
  logoutButton: {
    fontSize: "0.9rem",
    backgroundColor: "var(--logout-bg)",
    borderColor: "var(--logout-border)",
    color: "var(--logout-fg)",
    ":hover": {
      backgroundColor: "var(--logout-hover-bg)",
      borderColor: "var(--logout-hover-border)",
      color: "var(--logout-fg)",
    },
    ":active": {
      backgroundColor: "var(--logout-active-bg)",
      borderColor: "var(--logout-active-border)",
      color: "var(--logout-fg)",
    },
  },
  menuLogoutButton: {
    width: "100%",
    justifyContent: "center",
  },
  message: {
    width: "100%",
    fontSize: "0.9rem",
  },
});

function getUserMenuThemeTokens(selectedThemeId, themeMode) {
  const themeFamily = String(selectedThemeId ?? "").replace(/-(light|dark)$/i, "");

  if (themeFamily === "golden") {
    return themeMode === "light"
      ? {
          popoverBg: "#f8eed7",
          popoverFg: "#5b430f",
          popoverBorder: "#ead7ab",
          popoverShadow: "0 10px 24px rgba(184, 130, 23, 0.14)",
          comboBg: "#f8eed7",
          comboFg: "#5b430f",
          comboBorder: "#e3cf9e",
          fieldLabel: "#87672a",
        }
      : {
          popoverBg: "#241b0c",
          popoverFg: "#fff2d2",
          popoverBorder: "#6e541d",
          popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.30)",
          comboBg: "#30230d",
          comboFg: "#fff2d2",
          comboBorder: "#5f4918",
          fieldLabel: "#f0d184",
        };
  }

  if (themeFamily === "bluedark") {
    return themeMode === "light"
      ? {
          popoverBg: "#eef5fb",
          popoverFg: "#17324d",
          popoverBorder: "#d6e5f0",
          popoverShadow: "0 10px 24px rgba(30, 90, 138, 0.12)",
          comboBg: "#eef5fb",
          comboFg: "#17324d",
          comboBorder: "#d6e5f0",
          fieldLabel: "#5a7690",
        }
      : {
          popoverBg: "#12283d",
          popoverFg: "#edf5fb",
          popoverBorder: "#27435d",
          popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.30)",
          comboBg: "#173148",
          comboFg: "#edf5fb",
          comboBorder: "#315370",
          fieldLabel: "#b7cedf",
        };
  }

  if (themeFamily === "gray") {
    return themeMode === "light"
      ? {
          popoverBg: "#efefef",
          popoverFg: "#2d2d2d",
          popoverBorder: "#d8d8d8",
          popoverShadow: "0 10px 24px rgba(95, 95, 95, 0.12)",
          comboBg: "#efefef",
          comboFg: "#2d2d2d",
          comboBorder: "#d8d8d8",
          fieldLabel: "#6d6d6d",
        }
      : {
          popoverBg: "#2b2b2b",
          popoverFg: "#f1f1f1",
          popoverBorder: "#444444",
          popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.30)",
          comboBg: "#323232",
          comboFg: "#f1f1f1",
          comboBorder: "#4b4b4b",
          fieldLabel: "#c9c9c9",
        };
  }

  if (themeFamily === "black") {
    return themeMode === "light"
      ? {
          popoverBg: "#ebebeb",
          popoverFg: "#1a1a1a",
          popoverBorder: "#d6d6d6",
          popoverShadow: "0 10px 24px rgba(18, 18, 18, 0.16)",
          comboBg: "#ebebeb",
          comboFg: "#1a1a1a",
          comboBorder: "#d6d6d6",
          fieldLabel: "#5d5d5d",
        }
      : {
          popoverBg: "#121212",
          popoverFg: "#f5f5f5",
          popoverBorder: "#242424",
          popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.36)",
          comboBg: "#1a1a1a",
          comboFg: "#f5f5f5",
          comboBorder: "#3b3b3b",
          fieldLabel: "#bdbdbd",
        };
  }

  if (themeFamily === "green") {
    return themeMode === "light"
      ? {
          popoverBg: "#eaf9f0",
          popoverFg: "#19593a",
          popoverBorder: "#cdeedc",
          popoverShadow: "0 10px 24px rgba(42, 135, 88, 0.12)",
          comboBg: "#eaf9f0",
          comboFg: "#19593a",
          comboBorder: "#cdeedc",
          fieldLabel: "#359d67",
        }
      : {
          popoverBg: "#163e2d",
          popoverFg: "#e8f7ee",
          popoverBorder: "#28533f",
          popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.30)",
          comboBg: "#184631",
          comboFg: "#e8f7ee",
          comboBorder: "#2d6a4e",
          fieldLabel: "#a3e0c1",
        };
  }

  if (themeFamily === "pink") {
    return themeMode === "light"
      ? {
          popoverBg: "#fdeaf7",
          popoverFg: "#782c61",
          popoverBorder: "#f8c9e8",
          popoverShadow: "0 10px 24px rgba(201, 81, 167, 0.12)",
          comboBg: "#fdeaf7",
          comboFg: "#782c61",
          comboBorder: "#f8c9e8",
          fieldLabel: "#af4390",
        }
      : {
          popoverBg: "#5c214a",
          popoverFg: "#fff5fb",
          popoverBorder: "#87336d",
          popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.30)",
          comboBg: "#6a2755",
          comboFg: "#fff5fb",
          comboBorder: "#943778",
          fieldLabel: "#f3a3db",
        };
  }

  if (themeFamily === "red") {
    return themeMode === "light"
      ? {
          popoverBg: "#ffeaf0",
          popoverFg: "#842033",
          popoverBorder: "#ffd3de",
          popoverShadow: "0 10px 24px rgba(188, 53, 80, 0.12)",
          comboBg: "#ffeaf0",
          comboFg: "#842033",
          comboBorder: "#ffd3de",
          fieldLabel: "#bc3550",
        }
      : {
          popoverBg: "#651726",
          popoverFg: "#fff1f5",
          popoverBorder: "#842033",
          popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.30)",
          comboBg: "#7a1c2d",
          comboFg: "#fff1f5",
          comboBorder: "#a12a40",
          fieldLabel: "#fb9ab0",
        };
  }

  return themeMode === "light"
    ? {
        popoverBg: "#eef6fd",
        popoverFg: "#123252",
        popoverBorder: "#d9e8f7",
        popoverShadow: "0 10px 24px rgba(15, 108, 189, 0.08)",
        comboBg: "#eef6fd",
        comboFg: "#123252",
        comboBorder: "#d5e7f8",
        fieldLabel: "#4a6a86",
      }
    : {
        popoverBg: "#132235",
        popoverFg: "#f5f9ff",
        popoverBorder: "#244869",
        popoverShadow: "0 10px 24px rgba(0, 0, 0, 0.24)",
        comboBg: "#1b314d",
        comboFg: "#f5f9ff",
        comboBorder: "#223b58",
        fieldLabel: "#c7dbee",
      };
}

export function getTopNavThemeStyles(selectedThemeId, themeMode) {
  const userMenu = getUserMenuThemeTokens(selectedThemeId, themeMode);

  return {
    navRoot: {
      backgroundColor: "var(--app-nav-bg)",
      borderBottom: "1px solid var(--app-nav-border)",
      color: "var(--app-nav-foreground)",
      "--nav-foreground": "var(--app-nav-foreground)",
      boxShadow: "var(--app-nav-shadow)",
    },
    navButton: {
      color: "var(--app-nav-foreground)",
    },
    authorizationAlertButton: {
      color: "#1f2937",
      backgroundColor: "#f6b73c",
      borderColor: "#f6b73c",
      ":hover": {
        color: "#1f2937",
        backgroundColor: "#e4a427",
        borderColor: "#e4a427",
      },
      ":active": {
        color: "#1f2937",
        backgroundColor: "#cc8e17",
        borderColor: "#cc8e17",
      },
    },
    combo: {
      color: "var(--app-combo-fg)",
      backgroundColor: "var(--app-combo-bg)",
      borderColor: "var(--app-combo-border)",
    },
    themeCombo: {
      color: userMenu.comboFg,
      backgroundColor: userMenu.comboBg,
      borderColor: userMenu.comboBorder,
      "& input": {
        color: userMenu.comboFg,
        backgroundColor: userMenu.comboBg,
      },
      "& button": {
        color: userMenu.comboFg,
        backgroundColor: userMenu.comboBg,
      },
    },
    userPopover: {
      background: userMenu.popoverBg,
      backgroundColor: userMenu.popoverBg,
      backgroundImage: "none",
      color: userMenu.popoverFg,
      border: `1px solid ${userMenu.popoverBorder}`,
      boxShadow: userMenu.popoverShadow,
      opacity: 1,
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
    },
    menuTitle: {
      color: userMenu.popoverFg,
    },
    fieldLabel: {
      color: userMenu.fieldLabel,
    },
    menuActionButton: {
      color: userMenu.popoverFg,
      backgroundColor: "transparent",
    },
    flag: {
      boxShadow: "var(--app-flag-shadow)",
    },
    logoutButton: {
      "--logout-bg": "#c4314b",
      "--logout-border": "#c4314b",
      "--logout-hover-bg": "#a6263d",
      "--logout-hover-border": "#a6263d",
      "--logout-active-bg": "#861f32",
      "--logout-active-border": "#861f32",
      "--logout-fg": "#ffffff",
    },
    message: {
      borderTop: "1px solid var(--app-nav-border)",
      backgroundColor: "var(--app-nav-message-bg)",
      color: "var(--app-nav-message-color)",
    },
  };
}
