import { useQuery } from "@tanstack/react-query";
import i18n from "../i18n";
import { config } from "../config/config";
import { MenuDTO } from "../models/menu/menu";

interface UseMenuResult {
  menu: MenuDTO[];
  loading: boolean;
  error: string | null;
}

export function useMenu(locale?: string): UseMenuResult {
  const menuQuery = useQuery<MenuDTO[], Error>({
    queryKey: ["menu-arbol", locale ?? i18n.language],
    queryFn: async () => {
      const res = await fetch(`${config.apiUrl}/home/obtenermenu`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 401) throw new Error(i18n.t("sessionExpired"));
      if (!res.ok) throw new Error(i18n.t("menuLoadError"));

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(i18n.t("invalidMenuJson"));
      }

      return res.json();
    },
    placeholderData: (previousData) => previousData ?? [],
    staleTime: 60 * 1000,
  });
  const menu = menuQuery.data ?? [];
  const error = menuQuery.isError && menu.length === 0 ? menuQuery.error.message : null;

  return {
    menu,
    loading: menuQuery.isLoading,
    error,
  };
}
