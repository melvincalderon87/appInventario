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
import { MetroService } from "../../services/metroService";
import { getMetroThemeStyles, useMetroStyles } from "../../styles/pages/metro/metroPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function MetroListPage() {
  const styles = useMetroStyles();
  const themeStyles = getMetroThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codMetro:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const metrosQuery = useQuery({
    queryKey: ["metros-listado", page, pageSize, search, sort],
    queryFn: () => MetroService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const metrosPage = metrosQuery.data ?? emptyPagedResult;
  const metros = useMemo(
    () => (Array.isArray(metrosPage.items) ? metrosPage.items : []),
    [metrosPage.items]
  );
  const loading = metrosQuery.isLoading;
  const busy = metrosQuery.isFetching;
  const error = metrosQuery.isError ? metrosQuery.error?.message || t("meterListLoadError") : "";

  const goTo = (route, metro) => {
    navigate(`${route}/${encodeURIComponent(metro.idMetro)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("meterListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("meterListCount", { count: metrosPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/metro/agregar")}
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
          placeholder={t("searchMeters")}
          aria-label={t("searchMeters")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={metrosPage.page}
          pageSize={metrosPage.pageSize}
          totalCount={metrosPage.totalCount}
          totalPages={metrosPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingMeters")} />
          </div>
        ) : metros.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("meterListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("meterCode"), sortKey: "codMetro" },
                  { label: t("meterName"), sortKey: "metro" },
                  { label: t("meterBay"), sortKey: "bahia" },
                ]}
              />
            ) : null}
            {metros.map((metro) => (
              <article
                key={metro.idMetro || metro.codMetro}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {metro.codMetro}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterName")}</Text>
                      <Text className={styles.userName}>{metro.metro}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterBay")}</Text>
                      <Text className={styles.userName}>{metro.bahia || metro.codBahia}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterArm")}</Text>
                      <Text className={styles.userName}>{metro.brazo || metro.codBrazo}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterProduct")}</Text>
                      <Text className={styles.userName}>{metro.producto || metro.codProducto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterType")}</Text>
                      <Text className={styles.userName}>{metro.tipoMetro}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterModel")}</Text>
                      <Text className={styles.userName}>{metro.modelo}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterSeries")}</Text>
                      <Text className={styles.userName}>{metro.serie}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("meterStatus")}</Text>
                      <Text className={styles.userName}>
                        {t(metro.estatus !== false ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/metro/visualizar", metro)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/metro/editar", metro)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/metro/eliminar", metro)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/metro/log", metro)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noMetersFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default MetroListPage;
