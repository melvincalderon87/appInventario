import { useMemo, useState } from "react";
import { Tree, Spinner, MessageBar, Input } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useMenu } from "../hooks/useMenu";
import { MenuNodo } from "./menuNodo";
import { Search } from "lucide-react";
import { getAppNavThemeStyles, useAppNavStyles } from "../styles/components/appNavStyles";
import { MenuDTO } from "../models/menu/menu";

interface AppNavProps {
  locale?: string;
}

export function AppNav({ locale }: AppNavProps) {
  const styles = useAppNavStyles();
  const { t } = useTranslation();
  const { menu, loading, error } = useMenu(locale);
  const [query, setQuery] = useState("");
  const themeStyles = getAppNavThemeStyles();

  const filteredMenu = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return menu;
    }

    const filterItems = (items: MenuDTO[]): MenuDTO[] =>
      items.flatMap((item) => {
        const matches = item.descripcion.toLowerCase().includes(normalizedQuery);
        const children = filterItems(item.children ?? []);

        return [...(matches ? [{ ...item, children: [] }] : []), ...children];
      });

    return filterItems(menu);
  }, [menu, query]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="small" label={t("menuLoading")} />
      </div>
    );
  }

  if (error) {
    return (
      <MessageBar intent="error" className={styles.error}>
        {error}
      </MessageBar>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.searchWrap} style={themeStyles.searchWrap}>
        <Input
          className={styles.searchInput}
          style={themeStyles.searchInput}
          contentBefore={<Search />}
          placeholder={t("searchMenu")}
          value={query}
          onChange={(_, data) => setQuery(data.value)}
        />
      </div>

      <Tree aria-label={t("appTitle")}>
        <MenuNodo items={filteredMenu} />
      </Tree>
    </nav>
  );
}
