import { makeStyles } from "@/components/ui/app-shadcn";

export const useCompaniaInspeccionActionPageStyles = makeStyles({
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
  lookupField: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "center",
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
  lookupInput: {
    minWidth: 0,
    cursor: "pointer",
  },
  lookupDialogSurface: {
    width: "min(92vw, 44rem)",
  },
  lookupDialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  lookupDialogHint: {
    color: "var(--app-muted-text, var(--app-user-label))",
    fontSize: "13px",
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
  lookupLoading: {
    minHeight: "180px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  lookupResults: {
    maxHeight: "360px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingRight: "2px",
  },
  lookupResultButton: {
    appearance: "none",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "12px",
    alignItems: "center",
    border: "1px solid var(--app-card-border)",
    borderRadius: "6px",
    backgroundColor: "var(--app-card-bg)",
    color: "var(--app-card-title, var(--app-user-value))",
    cursor: "pointer",
    padding: "10px 12px",
    textAlign: "left",
    boxSizing: "border-box",
    ":hover": {
      backgroundColor: "color-mix(in srgb, var(--app-card-bg) 88%, var(--app-card-border))",
    },
    ":focus-visible": {
      outline: "2px solid var(--app-primary, #2563eb)",
      outlineOffset: "2px",
    },
    "@media (max-width: 520px)": {
      gridTemplateColumns: "1fr",
      gap: "4px",
    },
  },
  lookupResultName: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 700,
  },
  lookupResultMeta: {
    color: "var(--app-muted-text, var(--app-user-label))",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  lookupEmpty: {
    color: "var(--app-muted-text, var(--app-user-label))",
    padding: "20px 0",
    textAlign: "center",
  },
  tabs: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    borderBottom: "1px solid var(--app-card-border)",
  },
  tabButton: {
    appearance: "none",
    border: "0",
    borderBottom: "2px solid transparent",
    backgroundColor: "transparent",
    color: "var(--app-muted-text, var(--app-user-label))",
    cursor: "pointer",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: 600,
    '&[aria-selected="true"]': {
      color: "var(--app-card-title, var(--app-user-value))",
      borderBottomColor: "var(--app-primary, var(--app-user-value))",
    },
  },
  filePanel: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  fileSelector: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
  },
  hiddenFileInput: {
    display: "none",
  },
  fileSelectorButton: {
    minHeight: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--app-card-border)",
    borderRadius: "6px",
    padding: "6px 12px",
    backgroundColor: "var(--app-card-bg)",
    color: "var(--app-card-title, var(--app-user-value))",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    boxSizing: "border-box",
    ":hover": {
      backgroundColor: "color-mix(in srgb, var(--app-card-bg) 88%, var(--app-card-border))",
    },
  },
  attachmentRows: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  attachmentRow: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1.4fr) minmax(160px, 1fr) minmax(120px, 0.7fr) auto",
    gap: "12px",
    alignItems: "end",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid var(--app-card-border)",
    "@media (max-width: 1080px)": {
      gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    },
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  attachmentActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
});

export function getCompaniaInspeccionActionPageThemeStyles() {
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
