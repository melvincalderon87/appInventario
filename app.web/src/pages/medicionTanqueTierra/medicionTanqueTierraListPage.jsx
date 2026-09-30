import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { MedicionTanqueTierraService } from "../../services/medicionTanqueTierraService";
import {
  getMedicionTanqueTierraThemeStyles,
  useMedicionTanqueTierraStyles,
} from "../../styles/pages/medicionTanqueTierra/medicionTanqueTierraPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

function formatDecimal(value, language) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat(language || "es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function MedicionTanqueTierraListPage() {
  const styles = useMedicionTanqueTierraStyles();
  const themeStyles = getMedicionTanqueTierraThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("fecha:desc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const medicionesQuery = useQuery({
    queryKey: ["mediciontanquetierra-listado", page, pageSize, search, sort],
    queryFn: () => MedicionTanqueTierraService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const medicionesPage = medicionesQuery.data ?? emptyPagedResult;
  const mediciones = useMemo(
    () => (Array.isArray(medicionesPage.items) ? medicionesPage.items : []),
    [medicionesPage.items]
  );
  const loading = medicionesQuery.isLoading;
  const busy = medicionesQuery.isFetching;
  const error = medicionesQuery.isError
    ? medicionesQuery.error?.message || t("groundTankMeasurementListLoadError")
    : "";

  const goTo = (route, medicion) => {
    navigate(`${route}/${encodeURIComponent(medicion.idMedicionTanqueTierra)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("groundTankMeasurementListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("groundTankMeasurementListCount", { count: medicionesPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/mediciontanquetierra/agregar")}
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
          placeholder={t("searchGroundTankMeasurements")}
          aria-label={t("searchGroundTankMeasurements")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={medicionesPage.page}
          pageSize={medicionesPage.pageSize}
          totalCount={medicionesPage.totalCount}
          totalPages={medicionesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingGroundTankMeasurements")} />
          </div>
        ) : mediciones.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("groundTankMeasurementListTitle")}>
            {mediciones.map((medicion) => (
              <article
                key={medicion.idMedicionTanqueTierra || medicion.codMedicionTanqueTierra}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("groundTankMeasurementCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {medicion.codMedicionTanqueTierra}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("groundTankMeasurementDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDateFilterByLanguage(medicion.fecha, i18n.language)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("groundTankMeasurementShip")}</Text>
                      <Text className={styles.userName}>{medicion.barco || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("groundTankMeasurementPartner")}</Text>
                      <Text className={styles.userName}>{medicion.suplidor || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("groundTankMeasurementProduct")}</Text>
                      <Text className={styles.userName}>{medicion.producto || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("groundTankMeasurementInspectionCompany")}
                      </Text>
                      <Text className={styles.userName}>{medicion.companiaInspeccion || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("groundTankMeasurementDetailCount")}
                      </Text>
                      <Text className={styles.userName}>{medicion.detalleCantidad ?? 0}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("groundTankMeasurementStandardGrossVolumeTotal")}
                      </Text>
                      <Text className={styles.userName}>
                        {formatDecimal(medicion.volumenEstandarBrutoTotal, i18n.language)}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/mediciontanquetierra/visualizar", medicion)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/mediciontanquetierra/editar", medicion)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/mediciontanquetierra/eliminar", medicion)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/mediciontanquetierra/log", medicion)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noGroundTankMeasurementsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default MedicionTanqueTierraListPage;
