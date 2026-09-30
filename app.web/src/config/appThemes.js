const BLUE_BRAND = {
  10: "#061724",
  20: "#082338",
  30: "#0b3050",
  40: "#0d3d67",
  50: "#0f4b7f",
  60: "#115998",
  70: "#1267af",
  80: "#1b75c9",
  90: "#3589d8",
  100: "#4e9de6",
  110: "#6aaeea",
  120: "#86bef0",
  130: "#a6d0f6",
  140: "#c5e1fa",
  150: "#deeffc",
  160: "#f1f8fe",
};

const GOLDEN_BRAND = {
  10: "#2d1b05",
  20: "#483008",
  30: "#65460a",
  40: "#845e0d",
  50: "#a27610",
  60: "#c18f14",
  70: "#d9a61c",
  80: "#e7bb3a",
  90: "#edc75a",
  100: "#f1d27a",
  110: "#f5dc97",
  120: "#f7e4af",
  130: "#faecc5",
  140: "#fcf2d8",
  150: "#fdf8ea",
  160: "#fffdf8",
};

const BLUEDARK_BRAND = {
  10: "#07131f",
  20: "#0d1f31",
  30: "#132d46",
  40: "#183b5d",
  50: "#1d4a75",
  60: "#255b8d",
  70: "#2d6da4",
  80: "#397fba",
  90: "#5595c8",
  100: "#73aad5",
  110: "#8dbbe0",
  120: "#a7cce8",
  130: "#bfdcf0",
  140: "#d6eaf6",
  150: "#e9f3fb",
  160: "#f7fbfe",
};

const GRAY_BRAND = {
  10: "#111111",
  20: "#1f1f1f",
  30: "#2d2d2d",
  40: "#3c3c3c",
  50: "#4b4b4b",
  60: "#5b5b5b",
  70: "#6d6d6d",
  80: "#808080",
  90: "#949494",
  100: "#a8a8a8",
  110: "#b9b9b9",
  120: "#c9c9c9",
  130: "#d8d8d8",
  140: "#e5e5e5",
  150: "#f1f1f1",
  160: "#fafafa",
};

const GREEN_BRAND = {
  10: "#071f14",
  20: "#0d3321",
  30: "#12452c",
  40: "#19593a",
  50: "#207048",
  60: "#2a8758",
  70: "#359d67",
  80: "#43b379",
  90: "#59c08a",
  100: "#72cd9d",
  110: "#89d7ae",
  120: "#a3e0c1",
  130: "#bbe8d1",
  140: "#d1f0df",
  150: "#e5f7ec",
  160: "#f4fcf7",
};

const PINK_BRAND = {
  10: "#2a1021",
  20: "#421836",
  30: "#5c214a",
  40: "#782c61",
  50: "#943778",
  60: "#af4390",
  70: "#c951a7",
  80: "#e061be",
  90: "#e978c8",
  100: "#ef8ed2",
  110: "#f3a3db",
  120: "#f7b7e3",
  130: "#f9c9ea",
  140: "#fbdaf0",
  150: "#fde9f6",
  160: "#fff5fb",
};

const RED_BRAND = {
  10: "#2b0c12",
  20: "#4a111c",
  30: "#651726",
  40: "#842033",
  50: "#a12a40",
  60: "#bc3550",
  70: "#d64562",
  80: "#ef5b78",
  90: "#f46f8b",
  100: "#f8859d",
  110: "#fb9ab0",
  120: "#fdb0c3",
  130: "#fec2d1",
  140: "#ffd3de",
  150: "#ffe3ea",
  160: "#fff1f5",
};

const BLACK_BRAND = {
  10: "#050505",
  20: "#0a0a0a",
  30: "#121212",
  40: "#1a1a1a",
  50: "#242424",
  60: "#2f2f2f",
  70: "#3b3b3b",
  80: "#4a4a4a",
  90: "#5d5d5d",
  100: "#737373",
  110: "#8a8a8a",
  120: "#a3a3a3",
  130: "#bdbdbd",
  140: "#d6d6d6",
  150: "#ebebeb",
  160: "#f7f7f7",
};

function createThemeTokens(brand) {
  return {
    brand,
    colorBrandBackground: brand[80],
    colorBrandForeground1: brand[70],
    colorBrandForeground2: brand[60],
    colorNeutralBackground1: "var(--app-sidebar-bg)",
    colorNeutralBackground2: "var(--app-root-bg)",
    colorNeutralForeground1: "var(--app-user-value)",
    colorNeutralForeground2: "var(--app-user-label)",
    colorNeutralStroke2: "var(--app-sidebar-border)",
  };
}

function createThemeFamily(id, label, brand) {
  return {
    id,
    label,
    mode: "light",
    theme: createThemeTokens(brand),
  };
}

const APP_THEMES = [
  createThemeFamily("blue", "Blue", BLUE_BRAND),
  createThemeFamily("bluedark", "BlueDark", BLUEDARK_BRAND),
  createThemeFamily("golden", "Golden", GOLDEN_BRAND),
  createThemeFamily("black", "Black", BLACK_BRAND),
  createThemeFamily("gray", "Gray", GRAY_BRAND),
  createThemeFamily("green", "Green", GREEN_BRAND),
  createThemeFamily("pink", "Pink", PINK_BRAND),
  createThemeFamily("red", "Red", RED_BRAND),
];

export function getAppThemes() {
  return APP_THEMES;
}

export function getDefaultThemeId() {
  return "blue";
}

export function getAppThemeById(themeId) {
  const normalizedThemeId = String(themeId ?? "")
    .replace("yammer-", "blue-")
    .replace(/-dark$/i, "-light");
  const normalizedFamilyId = normalizedThemeId.replace(/-light$/i, "");
  return APP_THEMES.find((item) => item.id === normalizedFamilyId) ?? APP_THEMES[0];
}
