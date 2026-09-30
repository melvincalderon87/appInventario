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
import { BahiaService } from "../../services/bahiaService";
import { getBahiaThemeStyles, useBahiaStyles } from "../../styles/pages/bahia/bahiaPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function BahiaListPage() {
  const styles = useBahiaStyles();
  const themeStyles = getBahiaThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codBahia:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const bahiasQuery = useQuery({
    queryKey: ["bahias-listado", page, pageSize, search, sort],
    queryFn: () => BahiaService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const bahiasPage = bahiasQuery.data ?? emptyPagedResult;
  const bahias = useMemo(
    () => (Array.isArray(bahiasPage.items) ? bahiasPage.items : []),
    [bahiasPage.items]
  );
  const loading = bahiasQuery.isLoading;
  const busy = bahiasQuery.isFetching;
  const error = bahiasQuery.isError ? bahiasQuery.error?.message || t("bayListLoadError") : "";

  const goTo = (route, bahia) => {
    navigate(`${route}/${encodeURIComponent(bahia.idBahia)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("bayListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("bayListCount", { count: bahiasPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/bahia/agregar")}
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
          placeholder={t("searchBays")}
          aria-label={t("searchBays")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={bahiasPage.page}
          pageSize={bahiasPage.pageSize}
          totalCount={bahiasPage.totalCount}
          totalPages={bahiasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingBays")} />
          </div>
        ) : bahias.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("bayListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("bayCode"), sortKey: "codBahia" },
                  { label: t("bayName"), sortKey: "bahia" },
                  { label: t("bayShortDescription"), sortKey: "descripcioncorta" },
                ]}
              />
            ) : null}
            {bahias.map((bahia) => (
              <article
                key={bahia.idBahia || bahia.codBahia}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("bayCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {bahia.codBahia}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("bayName")}</Text>
                      <Text className={styles.userName}>{bahia.bahia}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("bayShortDescription")}</Text>
                      <Text className={styles.userName}>{bahia.descripcionCorta}</Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/bahia/visualizar", bahia)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/bahia/editar", bahia)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/bahia/eliminar", bahia)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/bahia/log", bahia)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noBaysFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default BahiaListPage;
