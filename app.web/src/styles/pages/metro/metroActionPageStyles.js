import { makeStyles } from "@/components/ui/app-shadcn";

export const useMetroActionPageStyles = makeStyles({
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
    gap: "16px",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  lookupControl: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "center",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  lookupDialogSurface: {
    width: "min(760px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 48px)",
  },
  lookupSearchRow: {
    marginBottom: "12px",
  },
  lookupTableWrap: {
    maxHeight: "420px",
    overflow: "auto",
  },
  lookupTable: {
    minWidth: "520px",
  },
  lookupTableRow: {
    cursor: "pointer",
  },
  lookupActionCell: {
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  lookupEmptyCell: {
    padding: "18px",
    textAlign: "center",
    color: "var(--app-user-label)",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
});

export function getMetroActionPageThemeStyles() {
  return {
    surface: {
      backgroundColor: "var(--app-card-bg)",
      border: "1px solid var(--app-card-border)",
      boxShadow: "var(--app-card-shadow)",
    },
  };
}
