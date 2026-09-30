import { getBlueStyleThemeVars } from "./blueStyleTheme";
import { getBlueDarkStyleThemeVars } from "./bluedarkStyleTheme";
import { getBlackStyleThemeVars } from "./blackStyleTheme";
import { getGoldenStyleThemeVars } from "./goldenStyleTheme";
import { getGrayStyleThemeVars } from "./grayStyleTheme";
import { getGreenStyleThemeVars } from "./greenStyleTheme";
import { getPinkStyleThemeVars } from "./pinkStyleTheme";
import { getRedStyleThemeVars } from "./redStyleTheme";

const THEME_STYLE_RESOLVERS = {
  black: getBlackStyleThemeVars,
  blue: getBlueStyleThemeVars,
  bluedark: getBlueDarkStyleThemeVars,
  golden: getGoldenStyleThemeVars,
  gray: getGrayStyleThemeVars,
  green: getGreenStyleThemeVars,
  pink: getPinkStyleThemeVars,
  red: getRedStyleThemeVars,
};

function getThemeFamily(themeId) {
  return (
    String(themeId ?? "")
      .replace("yammer-", "blue-")
      .replace(/-(light|dark)$/i, "") || "blue"
  );
}

export function getAppStyleThemeVars(themeId, themeMode) {
  const themeFamily = getThemeFamily(themeId);
  const resolver = THEME_STYLE_RESOLVERS[themeFamily] ?? getBlueStyleThemeVars;

  return {
    ...resolver(themeMode),
    "--colorNeutralBackground1": "var(--app-sidebar-bg)",
    "--colorNeutralBackground2": "var(--app-root-bg)",
    "--colorNeutralForeground1": "var(--app-user-value)",
    "--colorNeutralForeground2": "var(--app-user-label)",
    "--colorNeutralStroke2": "var(--app-sidebar-border)",
  };
}

export function getThemeStyleResolvers() {
  return THEME_STYLE_RESOLVERS;
}
