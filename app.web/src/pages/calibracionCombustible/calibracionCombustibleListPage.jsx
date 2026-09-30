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
import { CalibracionCombustibleService } from "../../services/calibracionCombustibleService";
import {
  getTipoProductoThemeStyles,
  useTipoProductoStyles,
} from "../../styles/pages/tipoProducto/tipoProductoPageStyles";
import { emptyPagedResult } from "../../utils/pagination";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";

function valueOrDash(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function CalibracionCombustibleListPage() {
  const styles = useTipoProductoStyles();
  const themeStyles = getTipoProductoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codCalibracionCombustible:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const calibracionesQuery = useQuery({
    queryKey: ["calibracion-combustible-listado", page, pageSize, search, sort],
    queryFn: () => CalibracionCombustibleService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const calibracionesPage = calibracionesQuery.data ?? emptyPagedResult;
  const calibraciones = useMemo(
    () => (Array.isArray(calibracionesPage.items) ? calibracionesPage.items : []),
    [calibracionesPage.items]
  );
  const loading = calibracionesQuery.isLoading;
  const busy = calibracionesQuery.isFetching;
  const error = calibracionesQuery.isError
    ? calibracionesQuery.error?.message || t("armCalibrationListLoadError")
    : "";
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language || "es-GT", { maximumFractionDigits: 4 }),
    [i18n.language]
  );

  const formatDate = (value) => valueOrDash(formatDateByLanguage(value, i18n.language));
  const formatQuantity = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numberFormatter.format(numericValue) : "-";
  };
  const goTo = (route, calibracion) => {
    navigate(
      `/calibracioncombustible/${route}/${encodeURIComponent(calibracion.idCalibracionCombustible)}`
    );
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("armCalibrationListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("armCalibrationListCount", { count: calibracionesPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/calibracioncombustible/agregar")}
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
          placeholder={t("searchArmCalibrations")}
          aria-label={t("searchArmCalibrations")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={calibracionesPage.page}
          pageSize={calibracionesPage.pageSize}
          totalCount={calibracionesPage.totalCount}
          totalPages={calibracionesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingArmCalibrations")} />
          </div>
        ) : calibraciones.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("armCalibrationListTitle")}>
            {calibraciones.map((calibracion) => (
              <article
                key={calibracion.idCalibracionCombustible || calibracion.codCalibracionCombustible}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {calibracion.codCalibracionCombustible}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationDate")}</Text>
                      <Text className={styles.userName}>{formatDate(calibracion.fecha)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationNextDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDate(calibracion.proximaFecha)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationBay")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.bahia)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationArm")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.brazo)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationProduct")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.producto)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationTechnician")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.personal)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("armCalibrationInspectionCompany")}
                      </Text>
                      <Text className={styles.userName}>
                        {valueOrDash(calibracion.companiaInspeccion)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("armCalibrationQuantity")}</Text>
                      <Text className={styles.userName}>
                        {formatQuantity(calibracion.cantidadCalibracion)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("status")}</Text>
                      <Text className={styles.userName}>
                        {t(calibracion.estatus !== false ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("visualizar", calibracion)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("editar", calibracion)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("eliminar", calibracion)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("log", calibracion)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noArmCalibrationsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default CalibracionCombustibleListPage;
