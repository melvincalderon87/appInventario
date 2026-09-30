import { makeStyles } from "@/components/ui/app-shadcn";
import {
  getTipoProductoThemeStyles,
  useTipoProductoStyles,
} from "../tipoProducto/tipoProductoPageStyles";

const useTuberiaExtraStyles = makeStyles({
  summarySurface: {
    width: "100%",
    borderRadius: "8px",
    padding: "16px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  summaryTitle: {
    margin: 0,
    color: "var(--app-card-title, var(--app-user-value))",
  },
  chartWrap: {
    width: "100%",
    height: "280px",
    minHeight: "280px",
  },
  summaryTableWrap: {
    width: "100%",
    maxWidth: "100%",
    overflowX: "auto",
  },
  numericCell: {
    textAlign: "right",
    whiteSpace: "nowrap",
  },
});

export function useTuberiaStyles() {
  return {
    ...useTipoProductoStyles(),
    ...useTuberiaExtraStyles(),
  };
}

export { getTipoProductoThemeStyles as getTuberiaThemeStyles };
