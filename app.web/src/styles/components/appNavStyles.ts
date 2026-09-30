import { makeStyles } from "@/components/ui/app-shadcn";

export const useAppNavStyles = makeStyles({
  loading: {
    padding: "16px",
  },
  error: {
    margin: "8px",
  },
  searchWrap: {
    padding: "6px 0 8px",
  },
  searchInput: {
    width: "100%",
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "inherit",
  },
  nav: {
    width: "100%",
    height: "100%",
    overflowY: "auto",
    padding: "8px 12px 12px 10px",
    boxSizing: "border-box",
  },
});

export function getAppNavThemeStyles() {
  return {
    searchWrap: {
      borderBottom: "1px solid var(--app-search-border)",
    },
    searchInput: {
      backgroundColor: "var(--app-search-bg)",
      borderColor: "var(--app-search-border)",
      color: "var(--app-search-fg)",
      boxShadow: "none",
    },
  };
}
