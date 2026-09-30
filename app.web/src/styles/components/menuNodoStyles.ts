import { makeStyles, treeItemLayoutClassNames } from "@/components/ui/app-shadcn";

const MENU_CHILD_INDENT = 18;

export const useMenuNodoStyles = makeStyles({
  layout: {
    position: "relative",
    paddingRight: "26px",

    "& .app-ui-tree-label": {
      display: "-webkit-box",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "normal",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: "2",
    },

    [`& .${treeItemLayoutClassNames.expandIcon}`]: {
      position: "absolute",
      right: "6px",
      top: "50%",
      minWidth: "18px",
      paddingTop: "0",
      paddingBottom: "0",
      transform: "translateY(-50%)",
    },
  },
  childTree: {
    marginLeft: `${MENU_CHILD_INDENT}px`,
  },
});

export function getMenuNodoLayoutStyle(isActive: boolean) {
  return {
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "var(--app-menu-active-fg)" : "var(--app-menu-fg)",
    backgroundColor: isActive ? "var(--app-menu-active-bg)" : "transparent",
    borderRadius: "4px",
    cursor: "pointer",
    minHeight: "28px",
    paddingTop: "3px",
    paddingBottom: "3px",
    paddingInline: "6px",
    paddingRight: "26px",
    fontSize: "0.9rem",
    lineHeight: "1.2",
    paddingLeft: "6px",
  };
}
