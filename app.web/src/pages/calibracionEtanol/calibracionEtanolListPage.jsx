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
import { CalibracionEtanolService } from "../../services/calibracionEtanolService";
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

function CalibracionEtanolListPage() {
  const styles = useTipoProductoStyles();
  const themeStyles = getTipoProductoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codCalibracionEtanol:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const calibracionesQuery = useQuery({
    queryKey: ["calibracion-etanol-listado", page, pageSize, search, sort],
    queryFn: () => CalibracionEtanolService.listado(params),
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
    ? calibracionesQuery.error?.message || t("ethanolCalibrationListLoadError")
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
    navigate(`/calibracionetanol/${route}/${encodeURIComponent(calibracion.idCalibracionEtanol)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("ethanolCalibrationListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("ethanolCalibrationListCount", { count: calibracionesPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/calibracionetanol/agregar")}
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
          placeholder={t("searchEthanolCalibrations")}
          aria-label={t("searchEthanolCalibrations")}
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
            <Spinner label={t("loadingEthanolCalibrations")} />
          </div>
        ) : calibraciones.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("ethanolCalibrationListTitle")}>
            {calibraciones.map((calibracion) => (
              <article
                key={calibracion.idCalibracionEtanol || calibracion.codCalibracionEtanol}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {calibracion.codCalibracionEtanol}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationDate")}</Text>
                      <Text className={styles.userName}>{formatDate(calibracion.fecha)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationNextDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDate(calibracion.proximaFecha)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationBay")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.bahia)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationArm")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.brazo)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationProduct")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.producto)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationTechnician")}</Text>
                      <Text className={styles.userName}>{valueOrDash(calibracion.personal)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("ethanolCalibrationInspectionCompany")}
                      </Text>
                      <Text className={styles.userName}>
                        {valueOrDash(calibracion.companiaInspeccion)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ethanolCalibrationQuantity")}</Text>
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
          <Text className={styles.empty}>{t("noEthanolCalibrationsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default CalibracionEtanolListPage;
