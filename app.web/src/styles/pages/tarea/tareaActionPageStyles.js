import { makeStyles } from "@/components/ui/app-shadcn";

export const useTareaActionPageStyles = makeStyles({
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
  fullWidthField: {
    gridColumn: "1 / -1",
  },
  detailSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "18px",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
    gap: "12px",
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(180px, 1fr)) auto",
    gap: "12px",
    alignItems: "end",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid var(--app-card-border)",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  detailActions: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  editorField: {
    gridColumn: "1 / -1",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
});

export function getTareaActionPageThemeStyles() {
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
