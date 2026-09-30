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
import { BrazoService } from "../../services/brazoService";
import { getBrazoThemeStyles, useBrazoStyles } from "../../styles/pages/brazo/brazoPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function BrazoListPage() {
  const styles = useBrazoStyles();
  const themeStyles = getBrazoThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codBrazo:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const brazosQuery = useQuery({
    queryKey: ["brazos-listado", page, pageSize, search, sort],
    queryFn: () => BrazoService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const brazosPage = brazosQuery.data ?? emptyPagedResult;
  const brazos = useMemo(
    () => (Array.isArray(brazosPage.items) ? brazosPage.items : []),
    [brazosPage.items]
  );
  const loading = brazosQuery.isLoading;
  const busy = brazosQuery.isFetching;
  const error = brazosQuery.isError ? brazosQuery.error?.message || t("armListLoadError") : "";

  const goTo = (route, brazo) => {
    navigate(`${route}/${encodeURIComponent(brazo.idBrazo)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("armListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("armListCount", { count: brazosPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/brazo/agregar")}
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
          placeholder={t("searchArms")}
          aria-label={t("searchArms")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={brazosPage.page}
          pageSize={brazosPage.pageSize}
          totalCount={brazosPage.totalCount}
          totalPages={brazosPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingArms")} />
          </div>
        ) : brazos.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("armListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("armCode"), sortKey: "codBrazo" },
                  { label: t("armBay"), sortKey: "bahia" },
                  { label: t("armName"), sortKey: "brazo" },
                ]}
              />
            ) : null}
            {brazos.map((brazo) => (
              <article
                key={brazo.idBrazo || brazo.codBrazo}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {brazo.codBrazo}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armBay")}</Text>
                      <Text className={styles.userName}>{brazo.bahia}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armName")}</Text>
                      <Text className={styles.userName}>{brazo.brazo}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armStatus")}</Text>
                      <Text className={styles.userName}>
                        {t(brazo.estatus !== false ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/brazo/visualizar", brazo)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/brazo/editar", brazo)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/brazo/eliminar", brazo)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/brazo/log", brazo)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noArmsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default BrazoListPage;
