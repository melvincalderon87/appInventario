import { makeStyles } from "@/components/ui/app-shadcn";

export const useRolPermisoStyles = makeStyles({
  root: {
    width: "100%",
    minWidth: 0,
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
  subtitle: {
    display: "block",
    marginTop: "4px",
    color: "var(--app-user-label)",
  },
  formSurface: {
    width: "100%",
    minWidth: 0,
    borderRadius: "8px",
    padding: "14px",
    boxSizing: "border-box",
  },
  searchBar: {
    width: "100%",
    borderRadius: "8px",
    padding: "8px",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  searchInput: {
    width: "100%",
  },
  loading: {
    minHeight: "220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    display: "block",
    padding: "28px 0",
    textAlign: "center",
    color: "var(--app-user-label)",
  },
  permissionTableWrap: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "auto",
    overflowY: "visible",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  permissionTableCompact: {
    width: "100%",
    minWidth: "980px",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    border: "1px solid var(--app-card-border)",
    backgroundColor: "var(--app-card-bg)",
  },
  permissionCodeColumn: {
    width: "56px",
  },
  permissionMenuColumn: {
    width: "166px",
  },
  permissionTypeColumn: {
    width: "62px",
  },
  permissionActionColumn: {
    width: "62px",
  },
  permissionHeaderCell: {
    height: "36px",
    padding: "4px 2px",
    borderRight: "1px solid var(--app-nav-border)",
    borderBottom: "1px solid var(--app-card-border)",
    backgroundColor: "var(--app-nav-bg)",
    color: "var(--app-nav-foreground)",
    fontSize: "10px",
    fontWeight: 600,
    lineHeight: "1.05",
    textAlign: "center",
    verticalAlign: "middle",
    overflow: "hidden",
    overflowWrap: "anywhere",
    boxSizing: "border-box",
  },
  permissionCell: {
    height: "34px",
    padding: "3px 4px",
    borderRight: "1px solid var(--app-card-border)",
    borderBottom: "1px solid var(--app-card-border)",
    color: "var(--app-card-fg, var(--app-user-value))",
    fontSize: "11px",
    lineHeight: "1.15",
    verticalAlign: "middle",
    boxSizing: "border-box",
  },
  permissionRow: {
    backgroundColor: "var(--app-card-bg)",
    "&:nth-child(even)": {
      backgroundColor: "var(--app-root-bg)",
    },
    "&:hover": {
      backgroundColor: "var(--app-menu-active-bg)",
    },
  },
  permissionHeaderGrow: {
    display: "block",
    width: "100%",
    color: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    lineHeight: "inherit",
    overflow: "hidden",
    textOverflow: "clip",
    overflowWrap: "anywhere",
  },
  permissionMenuCodeHeader: {
    width: "56px",
  },
  permissionMenuCodeCell: {
    width: "56px",
    textAlign: "center",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  permissionMenuHeader: {
    width: "166px",
    textAlign: "left",
  },
  permissionMenuCell: {
    width: "166px",
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  permissionTypeHeader: {
    width: "62px",
  },
  permissionTypeCell: {
    width: "62px",
    textAlign: "center",
    overflow: "visible",
  },
  permissionLogHeader: {
    width: "62px",
  },
  permissionLogCell: {
    width: "62px",
    textAlign: "center",
    overflow: "visible",
    whiteSpace: "nowrap",
    "& .fui-Button": {
      minWidth: "28px",
      width: "28px",
      height: "28px",
      padding: 0,
      margin: "0 auto",
    },
    "& .fui-Button__icon": {
      margin: 0,
    },
  },
  tableSurface: {
    width: "100%",
    minWidth: 0,
    borderRadius: "8px",
    padding: "12px",
    boxSizing: "border-box",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "900px",
    "& .fui-TableHeaderCell": {
      backgroundColor: "var(--app-nav-bg)",
      color: "var(--app-nav-foreground)",
      fontWeight: 600,
    },
    "& .fui-TableCell": {
      color: "var(--app-card-fg, var(--app-user-value))",
    },
  },
  masterCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  masterArrowLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    textDecoration: "none",
    fontWeight: 600,
  },
  masterArrowImage: {
    width: "14px",
    height: "14px",
    display: "block",
  },
});

export function getRolPermisoThemeStyles() {
  return {
    surface: {
      backgroundColor: "var(--app-card-bg)",
      border: "1px solid var(--app-card-border)",
      boxShadow: "var(--app-card-shadow)",
    },
  };
}
