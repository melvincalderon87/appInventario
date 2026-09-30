import { TreeItem, TreeItemLayout, Tree } from "@/components/ui/app-shadcn";
import { useNavigate, useLocation } from "react-router-dom";
import { MenuDTO } from "../models/menu/menu";
import { getIcon } from "../utils/menuIcons";
import { getMenuNodoLayoutStyle, useMenuNodoStyles } from "../styles/components/menuNodoStyles";

interface Props {
  items: MenuDTO[];
}

const MENU_ICON_SIZE = 22;

function isExternalLink(link: string) {
  return /^https?:\/\//iu.test(link);
}

function normalizeMenuLink(link?: string) {
  const value = String(link ?? "").trim();

  if (!value) return "";

  if (isExternalLink(value)) return value;

  const withSlash = value.startsWith("/") ? value : `/${value}`;
  const normalized = withSlash.toLowerCase().replace(/\/+$/u, "") || "/";

  if (
    normalized === "/usuario" ||
    normalized === "/usuarios" ||
    normalized === "/usuario/list" ||
    normalized === "/usuarios/list" ||
    normalized === "/usuario/listar" ||
    normalized === "/usuarios/listar" ||
    normalized === "/usario/listar"
  ) {
    return "/usuario/listar";
  }

  return normalized;
}

function isActivePath(currentPath: string, menuPath: string) {
  if (!menuPath || isExternalLink(menuPath)) return false;

  if (currentPath === menuPath) return true;

  if (currentPath.startsWith(menuPath)) {
    const next = currentPath.charAt(menuPath.length);
    return next === "/";
  }

  return false;
}

export function MenuNodo({ items }: Props) {
  const styles = useMenuNodoStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = normalizeMenuLink(location.pathname);

  return (
    <>
      {items.map((item) => {
        const esBranch = item.children.length > 0;
        const link = normalizeMenuLink(item.link);
        const esActivo = !esBranch && isActivePath(activePath, link);
        const Icono = getIcon(item.icono);

        return (
          <TreeItem key={item.codMenu} itemType={esBranch ? "branch" : "leaf"}>
            <TreeItemLayout
              className={styles.layout}
              iconBefore={Icono ? <Icono size={MENU_ICON_SIZE} /> : undefined}
              style={getMenuNodoLayoutStyle(esActivo)}
              onClick={() => {
                if (!esBranch && link) {
                  if (isExternalLink(link)) {
                    window.open(link, "_blank", "noopener,noreferrer");
                    return;
                  }

                  navigate(link);
                }
              }}
            >
              {item.descripcion}
            </TreeItemLayout>

            {esBranch && (
              <Tree className={styles.childTree}>
                <MenuNodo items={item.children} />
              </Tree>
            )}
          </TreeItem>
        );
      })}
    </>
  );
}
