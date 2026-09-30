import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { CompaniaInspeccionService } from "../../services/companiaInspeccionService";
import { PersonalExternoService } from "../../services/personalExternoService";
import {
  getPersonalExternoThemeStyles,
  usePersonalExternoStyles,
} from "../../styles/pages/personalExterno/personalExternoPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function PersonalExternoListPage() {
  const styles = usePersonalExternoStyles();
  const themeStyles = getPersonalExternoThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idCompaniaInspeccion = "" } = useParams();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codPersonalExterno:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const hasCompanySelected = Boolean(idCompaniaInspeccion);

  const companiasQuery = useQuery({
    queryKey: ["personal-externo-selector-companias", page, pageSize, search, sort],
    queryFn: () => CompaniaInspeccionService.listado(params),
    enabled: !hasCompanySelected,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const companiaQuery = useQuery({
    queryKey: ["personal-externo-compania-seleccionada", idCompaniaInspeccion],
    queryFn: () => CompaniaInspeccionService.obtener(idCompaniaInspeccion),
    enabled: hasCompanySelected,
    staleTime: 0,
  });

  const personalQuery = useQuery({
    queryKey: ["personal-externo-listado", idCompaniaInspeccion, page, pageSize, search, sort],
    queryFn: () => PersonalExternoService.listado({ ...params, idCompaniaInspeccion }),
    enabled: hasCompanySelected,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const companiasPage = companiasQuery.data ?? emptyPagedResult;
  const companias = useMemo(
    () => (Array.isArray(companiasPage.items) ? companiasPage.items : []),
    [companiasPage.items]
  );

  const personalPage = personalQuery.data ?? emptyPagedResult;
  const personal = useMemo(
    () => (Array.isArray(personalPage.items) ? personalPage.items : []),
    [personalPage.items]
  );

  const selectedCompany = companiaQuery.data;
  const selectedCompanyName =
    selectedCompany?.nombreComercial || t("externalStaffSelectedCompanyFallback");
  const loading = hasCompanySelected
    ? personalQuery.isLoading || companiaQuery.isLoading
    : companiasQuery.isLoading;
  const busy = hasCompanySelected
    ? personalQuery.isFetching || companiaQuery.isFetching
    : companiasQuery.isFetching;
  const error = hasCompanySelected
    ? (companiaQuery.isError
        ? companiaQuery.error?.message || t("inspectionCompanyLoadError")
        : "") ||
      (personalQuery.isError ? personalQuery.error?.message || t("externalStaffListLoadError") : "")
    : companiasQuery.isError
      ? companiasQuery.error?.message || t("inspectionCompanyListLoadError")
      : "";

  const goTo = (route, item) => {
    navigate(`${route}/${encodeURIComponent(item.idPersonalExterno)}`);
  };

  const renderSelectorCompanias = () => (
    <>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("externalStaffSelectCompanyTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("inspectionCompanyListCount", { count: companiasPage.totalCount })}
          </Text>
        </div>
      </div>

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
          <div className={styles.cardGrid} aria-label={t("externalStaffSelectCompanyTitle")}>
            {companias.map((compania) => (
              <article
                key={compania.idCompaniaInspeccion || compania.codCompaniaInspeccion}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("inspectionCompanyCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {compania.codCompaniaInspeccion}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("inspectionCompanyCommercialName")}
                      </Text>
                      <Text className={styles.userName}>{compania.nombreComercial}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("inspectionCompanyNit")}</Text>
                      <Text className={styles.userName}>{compania.nit}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <ListActionButton
                    action="visualizar"
                    label={t("externalStaffSelectCompanyAction")}
                    text={t("externalStaffSelectCompanyAction")}
                    onClick={() =>
                      navigate(
                        `/personalexterno/listar/${encodeURIComponent(compania.idCompaniaInspeccion)}`
                      )
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noInspectionCompaniesFound")}</Text>
        )}
      </div>
    </>
  );

  const renderListadoPersonal = () => (
    <>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>
            {t("externalStaffCompanyListTitle", { company: selectedCompanyName })}
          </Title2>
          <Text className={styles.subtitle}>
            {t("externalStaffListCount", { count: personalPage.totalCount })}
          </Text>
        </div>
        <div className={styles.actions}>
          <ListActionButton
            action="regresar"
            label={t("back")}
            text={t("back")}
            onClick={() => navigate("/companiainspeccion/listar")}
          />
          {tienePermiso("agregar") ? (
            <ListActionButton
              action="agregar"
              label={t("add")}
              text={t("add")}
              onClick={() =>
                navigate(`/personalexterno/agregar/${encodeURIComponent(idCompaniaInspeccion)}`)
              }
            />
          ) : null}
        </div>
      </div>

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchExternalStaff")}
          aria-label={t("searchExternalStaff")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={personalPage.page}
          pageSize={personalPage.pageSize}
          totalCount={personalPage.totalCount}
          totalPages={personalPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingExternalStaff")} />
          </div>
        ) : personal.length > 0 ? (
          <div
            className={styles.cardGrid}
            aria-label={t("externalStaffCompanyListTitle", { company: selectedCompanyName })}
          >
            {personal.map((item) => (
              <article
                key={item.idPersonalExterno || item.codPersonalExterno}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("externalStaffCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {item.codPersonalExterno}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("externalStaffName")}</Text>
                      <Text className={styles.userName}>{item.nombre}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("externalStaffTechnicianCode")}</Text>
                      <Text className={styles.userName}>{item.codTecnico || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("externalStaffPosition")}</Text>
                      <Text className={styles.userName}>{item.puesto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("externalStaffIsTechnician")}</Text>
                      <Text className={styles.userName}>{t(item.esTecnico ? "yes" : "no")}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("status")}</Text>
                      <Text className={styles.userName}>
                        {t(item.estatus ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/personalexterno/visualizar", item)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/personalexterno/editar", item)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/personalexterno/eliminar", item)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/personalexterno/log", item)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noExternalStaffFound")}</Text>
        )}
      </div>
    </>
  );

  return (
    <section className={styles.root}>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {hasCompanySelected ? renderListadoPersonal() : renderSelectorCompanias()}
    </section>
  );
}

export default PersonalExternoListPage;
