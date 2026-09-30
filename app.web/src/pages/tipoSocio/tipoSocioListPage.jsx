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
import { SocioService } from "../../services/socioService";
import { getSocioThemeStyles, useSocioStyles } from "../../styles/pages/socio/socioPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function SocioListPage() {
  const styles = useSocioStyles();
  const themeStyles = getSocioThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codSocio:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const tiposSocioQuery = useQuery({
    queryKey: ["tipos-socio-listado", page, pageSize, search, sort],
    queryFn: () => SocioService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const tiposSocioPage = tiposSocioQuery.data ?? emptyPagedResult;
  const tiposSocio = useMemo(
    () => (Array.isArray(tiposSocioPage.items) ? tiposSocioPage.items : []),
    [tiposSocioPage.items]
  );
  const loading = tiposSocioQuery.isLoading;
  const busy = tiposSocioQuery.isFetching;
  const error = tiposSocioQuery.isError
    ? tiposSocioQuery.error?.message || t("partnerTypeListLoadError")
    : "";

  const goTo = (route, socio) => {
    navigate(`${route}/${encodeURIComponent(socio.idSocio)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("partnerTypeListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("partnerTypeListCount", { count: tiposSocioPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/socio/agregar")}
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
          placeholder={t("searchPartnerTypes")}
          aria-label={t("searchPartnerTypes")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={tiposSocioPage.page}
          pageSize={tiposSocioPage.pageSize}
          totalCount={tiposSocioPage.totalCount}
          totalPages={tiposSocioPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingPartnerTypes")} />
          </div>
        ) : tiposSocio.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("partnerTypeListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("partnerTypeCode"), sortKey: "codSocio" },
                  { label: t("partnerTypeName"), sortKey: "socio" },
                  { label: t("partnerTypeShortDescription"), sortKey: "nombreCortoSocio" },
                ]}
              />
            ) : null}
            {tiposSocio.map((socio) => (
              <article
                key={socio.idSocio || socio.codSocio}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerTypeCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {socio.codSocio}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerTypeName")}</Text>
                      <Text className={styles.userName}>{socio.socio}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerTypeShortDescription")}</Text>
                      <Text className={styles.userName}>{socio.nombreCortoSocio}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerTypeStatus")}</Text>
                      <Text className={styles.userName}>
                        {t(socio.estatus !== false ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/socio/visualizar", socio)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/socio/editar", socio)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/socio/eliminar", socio)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/socio/log", socio)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noPartnerTypesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default SocioListPage;
