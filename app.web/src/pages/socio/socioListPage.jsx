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
import { SuplidorService } from "../../services/suplidorService";
import { getSocioThemeStyles, useSocioStyles } from "../../styles/pages/socio/socioPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function SocioListPage() {
  const styles = useSocioStyles();
  const themeStyles = getSocioThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codSuplidor:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const sociosQuery = useQuery({
    queryKey: ["socios-listado", page, pageSize, search, sort],
    queryFn: () => SuplidorService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const sociosPage = sociosQuery.data ?? emptyPagedResult;
  const socios = useMemo(
    () => (Array.isArray(sociosPage.items) ? sociosPage.items : []),
    [sociosPage.items]
  );
  const loading = sociosQuery.isLoading;
  const busy = sociosQuery.isFetching;
  const error = sociosQuery.isError ? sociosQuery.error?.message || t("partnerListLoadError") : "";

  const goTo = (route, socio) => {
    navigate(`${route}/${encodeURIComponent(socio.idSuplidor)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("partnerListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("partnerListCount", { count: sociosPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/suplidor/agregar")}
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
          placeholder={t("searchPartners")}
          aria-label={t("searchPartners")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={sociosPage.page}
          pageSize={sociosPage.pageSize}
          totalCount={sociosPage.totalCount}
          totalPages={sociosPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingPartners")} />
          </div>
        ) : socios.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("partnerListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("partnerCode"), sortKey: "codSuplidor" },
                  { label: t("partnerDescription"), sortKey: "suplidor" },
                  { label: t("partnerShortDescription"), sortKey: "suplidornombrecorto" },
                ]}
              />
            ) : null}
            {socios.map((socio) => (
              <article
                key={socio.idSuplidor || socio.codSuplidor}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {socio.codSuplidor}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerDescription")}</Text>
                      <Text className={styles.userName}>{socio.suplidor}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerShortDescription")}</Text>
                      <Text className={styles.userName}>{socio.suplidorNombreCorto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("partnerStatus")}</Text>
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
                      onClick={() => goTo("/suplidor/visualizar", socio)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/suplidor/editar", socio)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/suplidor/eliminar", socio)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/suplidor/log", socio)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noPartnersFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default SocioListPage;
