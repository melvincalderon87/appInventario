import { makeStyles } from "@/components/ui/app-shadcn";

export const useCambiarPasswordStyles = makeStyles({
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
  centeredFormWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  passwordFormSurface: {
    width: "100%",
    maxWidth: "520px",
    borderRadius: "8px",
    padding: "22px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  loading: {
    minHeight: "220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  passwordUserInfo: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    paddingBottom: "18px",
    borderBottom: "1px solid var(--app-card-border)",
  },
  cardField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  metaLabel: {
    color: "var(--app-user-label)",
    fontSize: "12px",
  },
  userCode: {
    display: "block",
    color: "var(--app-card-title, var(--app-user-value))",
    overflowWrap: "anywhere",
  },
  userName: {
    display: "block",
    color: "var(--app-card-fg, var(--app-user-value))",
    overflowWrap: "anywhere",
  },
  metaValue: {
    color: "var(--app-card-fg, var(--app-user-value))",
    overflowWrap: "anywhere",
  },
  verticalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
});

export function getCambiarPasswordThemeStyles() {
  return {
    surface: {
      backgroundColor: "var(--app-card-bg)",
      border: "1px solid var(--app-card-border)",
      boxShadow: "var(--app-card-shadow)",
    },
  };
}
