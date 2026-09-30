import { makeStyles } from "@/components/ui/app-shadcn";

export const useMainLayoutStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  shell: {
    display: "flex",
    minHeight: 0,
    flex: 1,
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
  },
  userStrip: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "6px",
    minHeight: "30px",
    padding: "6px 18px 4px 14px",
    fontSize: "0.88rem",
    color: "var(--colorNeutralForeground2)",
    backgroundColor: "var(--app-user-strip-bg)",
  },
  userStripValue: {
    color: "var(--colorNeutralForeground1)",
    fontWeight: "600",
  },
  sidebar: {
    width: "240px",
    borderRight: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
    transitionDuration: "200ms",
    transitionProperty: "width, border-right-width",
    transitionTimingFunction: "ease",
  },
  sidebarHidden: {
    width: "0",
    borderRightWidth: "0",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    backgroundColor: "var(--colorNeutralBackground2)",
    minWidth: 0,
  },
  page: {
    minHeight: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: "700px",
    padding: "32px",
  },
});

export function getMainLayoutThemeStyles() {
  return {
    root: { backgroundColor: "var(--app-root-bg)" },
    sidebar: {
      backgroundColor: "var(--app-sidebar-bg)",
      borderRight: "1px solid var(--app-sidebar-border)",
    },
    userLabel: { color: "var(--app-user-label)" },
    userValue: { color: "var(--app-user-value)" },
    card: {
      backgroundColor: "var(--app-card-bg)",
      border: "1px solid var(--app-card-border)",
      boxShadow: "var(--app-card-shadow)",
    },
  };
}
