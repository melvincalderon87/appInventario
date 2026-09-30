import { makeStyles } from "@/components/ui/app-shadcn";

export const useTipoProductoActionPageStyles = makeStyles({
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
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  lookupControl: { display: "flex", gap: "8px", alignItems: "center" },
  lookupDialogSurface: { width: "min(720px, calc(100vw - 32px))" },
  lookupSearchRow: { marginBottom: "12px" },
  lookupTableWrap: { maxHeight: "420px", overflowY: "auto" },
  lookupTable: { minWidth: "560px" },
  lookupTableRow: { cursor: "pointer" },
  lookupActionCell: { width: "1%", whiteSpace: "nowrap" },
  lookupEmptyCell: { textAlign: "center", padding: "24px" },
});

export function getTipoProductoActionPageThemeStyles() {
  return {
    surface: {
      backgroundColor: "var(--app-card-bg)",
      border: "1px solid var(--app-card-border)",
      boxShadow: "var(--app-card-shadow)",
    },
  };
}
