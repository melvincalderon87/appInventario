import { makeStyles } from "@/components/ui/app-shadcn";

export const useSocioActionPageStyles = makeStyles({
  root: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    color: "var(--app-card-title, var(--app-user-value))",
  },
  formSurface: {
    width: "100%",
    borderRadius: "8px",
    padding: "20px",
    boxSizing: "border-box",
  },
  loading: {
    minHeight: "220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
    borderBottom: "1px solid var(--app-card-border)",
  },
  tabButton: {
    appearance: "none",
    border: "0",
    borderBottom: "3px solid transparent",
    backgroundColor: "transparent",
    color: "var(--app-muted-text, var(--app-user-label))",
    cursor: "pointer",
    padding: "10px 14px",
    fontSize: "15px",
    fontWeight: 600,
    lineHeight: "20px",
    "&:hover": {
      color: "var(--app-card-title, var(--app-user-value))",
      backgroundColor: "color-mix(in srgb, var(--app-card-bg) 88%, var(--app-card-border))",
    },
    '&[aria-selected="true"]': {
      color: "var(--app-card-title, var(--app-user-value))",
      borderBottomColor: "var(--app-primary, var(--app-user-value))",
    },
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
    gap: "16px",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  distributionList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  distributionRow: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 1fr) minmax(160px, 220px) auto",
    gap: "12px",
    alignItems: "end",
    padding: "14px",
    border: "1px solid var(--app-card-border)",
    borderRadius: "8px",
    boxSizing: "border-box",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  lookupField: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "center",
  },
  lookupDialogSurface: {
    width: "min(680px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 48px)",
  },
  lookupDialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  lookupTableWrap: {
    maxHeight: "420px",
    overflowY: "auto",
  },
  lookupTable: {
    minWidth: "560px",
  },
  lookupTableRow: {
    cursor: "pointer",
  },
  lookupActionCell: {
    width: "1%",
    whiteSpace: "nowrap",
  },
  lookupEmptyCell: {
    textAlign: "center",
    padding: "24px",
  },
  lookupResults: {
    maxHeight: "360px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  lookupResult: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "8px 10px",
    border: "1px solid var(--app-card-border)",
    borderRadius: "6px",
  },
  lookupResultText: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
});

export function getSocioActionPageThemeStyles() {
  return {
    surface: {
      backgroundColor: "var(--app-card-bg)",
      border: "1px solid var(--app-card-border)",
      boxShadow: "var(--app-card-shadow)",
    },
  };
}
