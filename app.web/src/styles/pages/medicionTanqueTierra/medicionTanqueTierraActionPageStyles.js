import { makeStyles } from "@/components/ui/app-shadcn";

export const useMedicionTanqueTierraActionPageStyles = makeStyles({
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
    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    gap: "16px",
    "@media (max-width: 980px)": {
      gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    },
    "@media (max-width: 680px)": {
      gridTemplateColumns: "1fr",
    },
  },
  detailSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "20px",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  detailTitle: {
    margin: 0,
    color: "var(--app-card-title, var(--app-user-value))",
  },
  detailRows: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  detailRow: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid var(--app-card-border)",
  },
  detailRowHeader: {
    display: "grid",
    gridTemplateColumns:
      "minmax(180px, 1fr) minmax(100px, 0.45fr) minmax(150px, 0.65fr) minmax(120px, 0.5fr) auto",
    gap: "12px",
    alignItems: "end",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    },
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(130px, 1fr))",
    gap: "12px",
    "@media (max-width: 1180px)": {
      gridTemplateColumns: "repeat(3, minmax(130px, 1fr))",
    },
    "@media (max-width: 760px)": {
      gridTemplateColumns: "repeat(2, minmax(130px, 1fr))",
    },
    "@media (max-width: 520px)": {
      gridTemplateColumns: "1fr",
    },
  },
  measurementFrames: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  measurementFrame: {
    minWidth: 0,
    margin: 0,
    padding: "14px 14px 16px",
    border: "1px solid var(--app-card-border)",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  measurementFrameTitle: {
    padding: "0 6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--app-card-title, var(--app-user-value))",
  },
  tankMeasurementGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
    gap: "12px",
    "@media (max-width: 980px)": {
      gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
    },
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  waterMeasurementGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
    gap: "12px",
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  detailActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  lookupField: { display: "flex", gap: "8px", alignItems: "center" },
  lookupDialogSurface: { maxWidth: "640px" },
  lookupDialogContent: { display: "flex", flexDirection: "column", gap: "12px" },
  lookupResults: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    maxHeight: "360px",
    overflowY: "auto",
  },
  lookupResultButton: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    textAlign: "left",
    padding: "5px 8px",
    border: "1px solid var(--app-card-border)",
    borderRadius: "6px",
    backgroundColor: "var(--app-card-bg)",
    color: "var(--app-user-value)",
    cursor: "pointer",
  },
  lookupResultMeta: { color: "var(--app-muted-text, var(--app-user-label))", whiteSpace: "nowrap" },
  lookupEmpty: { color: "var(--app-muted-text, var(--app-user-label))" },
});

export function getMedicionTanqueTierraActionPageThemeStyles() {
  return {
    surface: {
      backgroundColor: "var(--app-card-bg)",
      border: "1px solid var(--app-card-border)",
      boxShadow: "var(--app-card-shadow)",
    },
    detailRow: {
      backgroundColor: "color-mix(in srgb, var(--app-card-bg) 92%, var(--app-card-border))",
    },
  };
}
