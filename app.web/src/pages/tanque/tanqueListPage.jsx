import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { useState } from "react";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { ListViewModeToggle } from "../../components/common/ListViewModeToggle";
import { MasterListTableHeader } from "../../components/common/MasterListTableHeader";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { TanqueService } from "../../services/tanqueService";
import { getTanqueThemeStyles, useTanqueStyles } from "../../styles/pages/tanque/tanquePageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function TanqueListPage() {
  const styles = useTanqueStyles();
  const themeStyles = getTanqueThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codTanque:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const tanquesQuery = useQuery({
    queryKey: ["tanques-listado", page, pageSize, search, sort],
    queryFn: () => TanqueService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const tanquesPage = tanquesQuery.data ?? emptyPagedResult;
  const tanques = useMemo(
    () => (Array.isArray(tanquesPage.items) ? tanquesPage.items : []),
    [tanquesPage.items]
  );
  const loading = tanquesQuery.isLoading;
  const busy = tanquesQuery.isFetching;
  const error = tanquesQuery.isError ? tanquesQuery.error?.message || t("tankListLoadError") : "";

  const goTo = (route, tanque) => {
    navigate(`${route}/${encodeURIComponent(tanque.idTanque)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("tankListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("tankListCount", { count: tanquesPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/tanque/agregar")}
          />
        ) : null}
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchTanks")}
          aria-label={t("searchTanks")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={tanquesPage.page}
          pageSize={tanquesPage.pageSize}
          totalCount={tanquesPage.totalCount}
          totalPages={tanquesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingTanks")} />
          </div>
        ) : tanques.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("tankListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("tankCode"), sortKey: "codTanque" },
                  { label: t("tankName"), sortKey: "tanque" },
                  { label: t("tankProduct"), sortKey: "producto" },
                ]}
              />
            ) : null}
            {tanques.map((tanque) => (
              <article
                key={tanque.idTanque || tanque.codTanque}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCode")}</Text>
                      <Text className={styles.userName}>{tanque.codTanque}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankName")}</Text>
                      <Text weight="semibold" className={styles.userName}>
                        {tanque.tanque}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankProduct")}</Text>
                      <Text className={styles.userName}>{tanque.producto || "-"}</Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/tanque/visualizar", tanque)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/tanque/editar", tanque)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/tanque/eliminar", tanque)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/tanque/log", tanque)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noTanksFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default TanqueListPage;
