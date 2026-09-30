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
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import {
  getCompaniaInspeccionThemeStyles,
  useCompaniaInspeccionStyles,
} from "../../styles/pages/companiaInspeccion/companiaInspeccionPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function CompaniaInspeccionListPage() {
  const styles = useCompaniaInspeccionStyles();
  const themeStyles = getCompaniaInspeccionThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codCompaniaInspeccion:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const companiasQuery = useQuery({
    queryKey: ["companias-inspeccion-listado", page, pageSize, search, sort],
    queryFn: () => CompaniaInspeccionService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const companiasPage = companiasQuery.data ?? emptyPagedResult;
  const companias = useMemo(
    () => (Array.isArray(companiasPage.items) ? companiasPage.items : []),
    [companiasPage.items]
  );
  const loading = companiasQuery.isLoading;
  const busy = companiasQuery.isFetching;
  const error = companiasQuery.isError
    ? companiasQuery.error?.message || t("inspectionCompanyListLoadError")
    : "";

  const goTo = (route, item) => {
    navigate(`${route}/${encodeURIComponent(item.idCompaniaInspeccion)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("inspectionCompanyListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("inspectionCompanyListCount", { count: companiasPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/companiainspeccion/agregar")}
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
          placeholder={t("searchInspectionCompanies")}
          aria-label={t("searchInspectionCompanies")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={companiasPage.page}
          pageSize={companiasPage.pageSize}
          totalCount={companiasPage.totalCount}
          totalPages={companiasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingInspectionCompanies")} />
          </div>
        ) : companias.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("inspectionCompanyListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("inspectionCompanyCode"), sortKey: "codCompaniaInspeccion" },
                  { label: t("inspectionCompanyCommercialName"), sortKey: "nombreComercial" },
                  { label: t("inspectionCompanyFiscalName"), sortKey: "razonSocial" },
                ]}
              />
            ) : null}
            {companias.map((item) => (
              <article
                key={item.idCompaniaInspeccion || item.codCompaniaInspeccion}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("inspectionCompanyCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {item.codCompaniaInspeccion}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("inspectionCompanyCommercialName")}
                      </Text>
                      <Text className={styles.userName}>{item.nombreComercial}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("inspectionCompanyFiscalName")}</Text>
                      <Text className={styles.userName}>{item.nombreFiscal}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("inspectionCompanyNit")}</Text>
                      <Text className={styles.userName}>{item.nit}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("status")}</Text>
                      <Text className={styles.userName}>
                        {t(item.estatus ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/companiainspeccion/visualizar", item)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/companiainspeccion/editar", item)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/companiainspeccion/eliminar", item)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/companiainspeccion/log", item)}
                    />
                  ) : null}
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("inspectionCompanyExternalStaff")}
                      text={t("inspectionCompanyExternalStaff")}
                      onClick={() =>
                        navigate(
                          `/personalexterno/listar/${encodeURIComponent(item.idCompaniaInspeccion)}`
                        )
                      }
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noInspectionCompaniesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default CompaniaInspeccionListPage;
