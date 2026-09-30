import { makeStyles } from "@/components/ui/app-shadcn";

export const useTanqueActionPageStyles = makeStyles({
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
    flexWrap: "wrap",
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
  formRowFive: {
    gridTemplateColumns: "repeat(5, minmax(130px, 1fr))",
    "@media (max-width: 1180px)": {
      gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
    },
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
  productConfigRow: {
    gridTemplateColumns: "minmax(360px, 1.7fr) minmax(170px, 0.7fr) minmax(190px, 0.8fr)",
    "@media (max-width: 980px)": {
      gridTemplateColumns: "minmax(300px, 1.4fr) minmax(170px, 0.8fr)",
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
  commentStatusRow: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 1fr) minmax(220px, 320px)",
    gap: "16px",
    alignItems: "start",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  statusControls: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
    alignContent: "start",
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
  lookupSortButton: {
    width: "100%",
    minHeight: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: 0,
    border: 0,
    backgroundColor: "transparent",
    color: "inherit",
    font: "inherit",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    boxSizing: "border-box",
    ":hover": {
      color: "var(--app-card-title, var(--app-user-value))",
    },
  },
  lookupSortIndicator: {
    width: "16px",
    height: "16px",
    flex: "0 0 16px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
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
  formRowOne: {
    gridTemplateColumns: "minmax(220px, 1fr)",
  },
  heightGroups: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(240px, 1fr))",
    gap: "16px",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  heightFrame: {
    minWidth: 0,
    margin: 0,
    padding: "14px 14px 16px",
    border: "1px solid var(--app-card-border)",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  heightFrameTitle: {
    padding: "0 6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--app-card-title, var(--app-user-value))",
  },
  heightFrameGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(140px, 1fr))",
    gap: "16px",
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  volumeFrameGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
    gap: "16px",
    "@media (max-width: 1180px)": {
      gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
    },
    "@media (max-width: 720px)": {
      gridTemplateColumns: "1fr",
    },
  },
  relatedPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: 0,
  },
  relatedSummary: {
    color: "var(--app-user-label)",
  },
  relatedLoading: {
    minHeight: "160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  relatedTableSurface: {
    width: "100%",
    maxWidth: "100%",
    overflowX: "auto",
  },
  relatedTable: {
    minWidth: "860px",
  },
  empty: {
    display: "block",
    padding: "18px 0",
    textAlign: "center",
    color: "var(--app-user-label)",
  },
  masterCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
  },
  masterArrowLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    borderRadius: "6px",
    border: "1px solid var(--app-card-border)",
    color: "var(--app-card-title, var(--app-user-value))",
    textDecoration: "none",
    boxSizing: "border-box",
    ":hover": {
      backgroundColor: "color-mix(in srgb, var(--app-card-bg) 88%, var(--app-card-border))",
    },
  },
  masterArrowImage: {
    width: "14px",
    height: "14px",
    display: "block",
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

export function getTanqueActionPageThemeStyles() {
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
