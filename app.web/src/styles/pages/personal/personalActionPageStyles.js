import { makeStyles } from "@/components/ui/app-shadcn";

export const usePersonalActionPageStyles = makeStyles({
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
  formLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 1fr) 240px",
    gap: "24px",
    alignItems: "start",
    "@media (max-width: 820px)": {
      gridTemplateColumns: "1fr",
    },
  },
  fieldColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: 0,
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
  checkboxRow: {
    display: "flex",
    alignItems: "flex-end",
  },
  photoField: {
    width: "100%",
  },
  photoPanel: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "12px",
    border: "1px solid var(--app-card-border)",
    borderRadius: "8px",
    padding: "12px",
    backgroundColor: "color-mix(in srgb, var(--app-card-bg) 96%, var(--app-card-border))",
    boxSizing: "border-box",
    "@media (max-width: 820px)": {
      maxWidth: "260px",
    },
  },
  photoFrame: {
    width: "100%",
    aspectRatio: "3 / 4",
    border: "1px solid var(--app-card-border)",
    borderRadius: "6px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "color-mix(in srgb, var(--app-card-bg) 92%, var(--app-card-border))",
    color: "var(--app-user-label)",
    boxSizing: "border-box",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  photoInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: 0,
  },
  fileSelector: {
    display: "inline-flex",
    alignItems: "center",
    width: "100%",
  },
  hiddenFileInput: {
    display: "none",
  },
  fileSelectorButton: {
    width: "100%",
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
  photoActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  photoMeta: {
    color: "var(--app-user-label)",
    overflowWrap: "anywhere",
  },
  filePanel: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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

export function getPersonalActionPageThemeStyles() {
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
