import { makeStyles } from "@/components/ui/app-shadcn";

export const useBahiaActionPageStyles = makeStyles({
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
  formRows: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
  formRow: {
    display: "grid",
    gap: "16px",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  formRowThree: {
    gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    "@media (max-width: 920px)": {
      gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    },
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  formRowTwo: {
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  formRowOne: {
    gridTemplateColumns: "minmax(220px, 1fr)",
  },
  sectionFrame: {
    minWidth: 0,
    margin: 0,
    padding: "14px 14px 16px",
    border: "1px solid var(--app-card-border)",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  sectionFrameTitle: {
    padding: "0 6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--app-card-title, var(--app-user-value))",
  },
  sectionFrameGrid: {
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
  relatedPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  relatedLoading: {
    minHeight: "160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  relatedSummary: {
    color: "var(--app-muted-text, var(--app-user-label))",
    fontSize: "13px",
  },
  relatedTableSurface: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid var(--app-card-border)",
    borderRadius: "8px",
  },
  relatedTable: {
    minWidth: "860px",
  },
  relatedLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--app-primary, var(--app-card-title))",
    textDecorationLine: "none",
    fontWeight: 600,
    ":hover": {
      textDecorationLine: "underline",
    },
  },
  relatedLinkImage: {
    width: "16px",
    height: "16px",
    display: "block",
    flexShrink: 0,
  },
  empty: {
    display: "block",
    padding: "14px",
    textAlign: "center",
    color: "var(--app-muted-text, var(--app-user-label))",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
});

export function getBahiaActionPageThemeStyles() {
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
