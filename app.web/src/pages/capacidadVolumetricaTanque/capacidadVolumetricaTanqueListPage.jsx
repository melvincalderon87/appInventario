import { useMemo, useState } from "react";
import { Button, Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { IconFileTypePdf, IconFileTypeXls } from "@tabler/icons-react";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { CapacidadVolumetricaTanqueService } from "../../services/capacidadVolumetricaTanqueService";
import { TanqueService } from "../../services/tanqueService";
import {
  getCapacidadVolumetricaTanqueThemeStyles,
  useCapacidadVolumetricaTanqueStyles,
} from "../../styles/pages/capacidadVolumetricaTanque/capacidadVolumetricaTanquePageStyles";
import { emptyPagedResult } from "../../utils/pagination";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { downloadTankVolumetricCapacityTemplate } from "../../utils/tankVolumetricCapacityExcel";
import { downloadTankVolumetricCapacityDetail } from "../../utils/tankVolumetricCapacityExcel";
import { downloadTankVolumetricCapacityPdf } from "../../utils/tankVolumetricCapacityPdf";
import { ConfiguracionSistemaService } from "../../services/configuracionSistemaService";

const PRODUCT_TYPE_FILTERS = [
  { value: "", labelKey: "tankCalibrationProductTypeAll" },
  { value: "Combustible", labelKey: "tankCalibrationProductTypeCombustible" },
  { value: "Aditivo", labelKey: "tankCalibrationProductTypeAditivo" },
  { value: "Colorante", labelKey: "tankCalibrationProductTypeColorante" },
  { value: "Etanol", labelKey: "tankCalibrationProductTypeEtanol" },
];

function CapacidadVolumetricaTanqueListPage() {
  const styles = useCapacidadVolumetricaTanqueStyles();
  const themeStyles = getCapacidadVolumetricaTanqueThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idTanque = "" } = useParams();
  const { tienePermiso } = usePermisosPantalla();
  const [templateError, setTemplateError] = useState("");
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState("");
  const [tipoProducto, setTipoProducto] = useState("");
  const pagination = useServerPagination("");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const tieneTanqueSeleccionado = Boolean(idTanque);

  const tanquesQuery = useQuery({
    queryKey: [
      "capacidad-volumetrica-tanque-selector-tanques",
      page,
      pageSize,
      search,
      sort,
      tipoProducto,
    ],
    queryFn: () => TanqueService.listado({ ...params, tipoProducto }),
    enabled: !tieneTanqueSeleccionado,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const tanqueQuery = useQuery({
    queryKey: ["capacidad-volumetrica-tanque-tanque-seleccionado", idTanque],
    queryFn: () => TanqueService.obtener(idTanque),
    enabled: tieneTanqueSeleccionado,
    staleTime: 0,
  });

  const detallesQuery = useQuery({
    queryKey: ["capacidad-volumetrica-tanque-listado", idTanque, page, pageSize, search, sort],
    queryFn: () => CapacidadVolumetricaTanqueService.listado({ ...params, idTanque }),
    enabled: tieneTanqueSeleccionado,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const tanquesPage = tanquesQuery.data ?? emptyPagedResult;
  const tanques = useMemo(
    () => (Array.isArray(tanquesPage.items) ? tanquesPage.items : []),
    [tanquesPage.items]
  );

  const detallesPage = detallesQuery.data ?? emptyPagedResult;
  const detalles = useMemo(
    () => (Array.isArray(detallesPage.items) ? detallesPage.items : []),
    [detallesPage.items]
  );

  const selectedTank = tanqueQuery.data;
  const selectedTankName = selectedTank?.tanque || t("tankCalibrationSelectedTankFallback");
  const loading = tieneTanqueSeleccionado
    ? detallesQuery.isLoading || tanqueQuery.isLoading
    : tanquesQuery.isLoading;
  const busy = tieneTanqueSeleccionado
    ? detallesQuery.isFetching || tanqueQuery.isFetching
    : tanquesQuery.isFetching;
  const queryError = tieneTanqueSeleccionado
    ? (tanqueQuery.isError ? tanqueQuery.error?.message || t("tankLoadError") : "") ||
      (detallesQuery.isError
        ? detallesQuery.error?.message || t("tankCalibrationListLoadError")
        : "")
    : tanquesQuery.isError
      ? tanquesQuery.error?.message || t("tankListLoadError")
      : "";

  const goTo = (route, documento) => {
    navigate(`${route}/${encodeURIComponent(documento.idCapacidadVolumetricaTanque)}`);
  };

  const filterByProductType = (value) => {
    setTipoProducto(value);
    setPage(1);
  };

  const downloadTemplate = async () => {
    setTemplateError("");
    setTemplateDownloading(true);

    try {
      await downloadTankVolumetricCapacityTemplate(t);
    } catch (downloadError) {
      setTemplateError(downloadError.message || t("tankCalibrationTemplateDownloadError"));
    } finally {
      setTemplateDownloading(false);
    }
  };

  const downloadDetail = async (documento) => {
    try {
      setDownloadError("");
      setDownloading(`excel-${documento.idCapacidadVolumetricaTanque}`);
      const detail = await CapacidadVolumetricaTanqueService.obtener(
        documento.idCapacidadVolumetricaTanque
      );
      await downloadTankVolumetricCapacityDetail(detail, t);
    } catch (downloadException) {
      setDownloadError(downloadException.message || t("tankCalibrationDetailDownloadError"));
    } finally {
      setDownloading("");
    }
  };

  const downloadPdf = async (documento) => {
    try {
      setDownloadError("");
      setDownloading(`pdf-${documento.idCapacidadVolumetricaTanque}`);
      const [detail, empresa] = await Promise.all([
        CapacidadVolumetricaTanqueService.obtener(documento.idCapacidadVolumetricaTanque),
        ConfiguracionSistemaService.empresaInfo(),
      ]);
      downloadTankVolumetricCapacityPdf(detail, empresa);
    } catch (downloadException) {
      setDownloadError(downloadException.message || t("tankCalibrationPdfDownloadError"));
    } finally {
      setDownloading("");
    }
  };

  const renderSelectorTanques = () => (
    <>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("tankCalibrationSelectTankTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("tankListCount", { count: tanquesPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <div className={styles.actions}>
            <ListActionButton
              action="descargar"
              label={t("tankCalibrationDownloadTemplate")}
              text={t("tankCalibrationDownloadTemplate")}
              disabled={templateDownloading}
              onClick={downloadTemplate}
            />
          </div>
        ) : null}
      </div>

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchTanks")}
          aria-label={t("searchTanks")}
        />
      </div>

      <div
        className={styles.measureFilters}
        role="group"
        aria-label={t("tankCalibrationProductTypeFilter")}
      >
        {PRODUCT_TYPE_FILTERS.map(({ value, labelKey }) => (
          <Button
            key={value || "all"}
            appearance={tipoProducto === value ? "primary" : "secondary"}
            onClick={() => filterByProductType(value)}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={tanquesPage.page}
          pageSize={tanquesPage.pageSize}
          totalCount={tanquesPage.totalCount}
          totalPages={tanquesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingTanks")} />
          </div>
        ) : tanques.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("tankCalibrationSelectTankTitle")}>
            {tanques.map((tanque) => (
              <article
                key={tanque.idTanque || tanque.codTanque}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {tanque.codTanque}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("tankCalibrationTankDescription")}
                      </Text>
                      <Text className={styles.userName}>{tanque.tanque}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankOwnConsumption")}</Text>
                      <Text className={styles.userName}>
                        {tanque.consumoPropio ? t("yes") : t("no")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <ListActionButton
                    action="visualizar"
                    label={t("tankCalibrationSelectTankAction")}
                    text={t("tankCalibrationSelectTankAction")}
                    onClick={() =>
                      navigate(
                        `/capacidadvolumetricatanque/listar/${encodeURIComponent(tanque.idTanque)}`
                      )
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noTanksFound")}</Text>
        )}
      </div>
    </>
  );

  const renderListadoDetalles = () => (
    <>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>
            {t("tankCalibrationTankListTitle", { tank: selectedTankName })}
          </Title2>
          <Text className={styles.subtitle}>
            {t("tankCalibrationListCount", { count: detallesPage.totalCount })}
          </Text>
        </div>
        <div className={styles.actions}>
          <ListActionButton
            action="regresar"
            label={t("back")}
            text={t("back")}
            onClick={() => navigate("/capacidadvolumetricatanque/listar")}
          />
          {tienePermiso("agregar") ? (
            <>
              <ListActionButton
                action="agregar"
                label={t("tankCalibrationCalculateSixteenths")}
                text={t("tankCalibrationCalculateSixteenths")}
                onClick={() =>
                  navigate(`/capacidadvolumetricatanque/agregar/${encodeURIComponent(idTanque)}`)
                }
              />
              <ListActionButton
                action="agregar"
                label={t("tankCalibrationDirectUpload")}
                text={t("tankCalibrationDirectUpload")}
                onClick={() =>
                  navigate(
                    `/capacidadvolumetricatanque/agregar/directa/${encodeURIComponent(idTanque)}`
                  )
                }
              />
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchTankCalibrations")}
          aria-label={t("searchTankCalibrations")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={detallesPage.page}
          pageSize={detallesPage.pageSize}
          totalCount={detallesPage.totalCount}
          totalPages={detallesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingTankCalibrations")} />
          </div>
        ) : detalles.length > 0 ? (
          <div
            className={styles.cardGrid}
            aria-label={t("tankCalibrationTankListTitle", { tank: selectedTankName })}
          >
            {detalles.map((documento) => (
              <article
                key={
                  documento.idCapacidadVolumetricaTanque || documento.codCapacidadVolumetricaTanque
                }
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCalibrationCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {documento.codCapacidadVolumetricaTanque}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCalibrationDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDateByLanguage(documento.fechaCalibracion, i18n.language)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCalibrationProduct")}</Text>
                      <Text className={styles.userName}>{documento.producto || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("tankCalibrationInspectionCompany")}
                      </Text>
                      <Text className={styles.userName}>{documento.companiaInspeccion || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCalibrationDetailCount")}</Text>
                      <Text className={styles.userName}>{documento.detalleCantidad ?? 0}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCalibrationAttachments")}</Text>
                      <Text className={styles.userName}>{documento.adjuntoCantidad ?? 0}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCalibrationCurrent")}</Text>
                      <Text className={styles.userName}>
                        {documento.esActual ? t("yes") : t("no")}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankCalibrationComments")}</Text>
                      <Text className={styles.userName}>{documento.comentarios || "-"}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/capacidadvolumetricatanque/visualizar", documento)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/capacidadvolumetricatanque/editar", documento)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/capacidadvolumetricatanque/eliminar", documento)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/capacidadvolumetricatanque/log", documento)}
                    />
                  ) : null}
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="descargar"
                      label={t("tankCalibrationDownloadPdf")}
                      icon={<IconFileTypePdf size={16} color="#c62828" />}
                      disabled={Boolean(downloading)}
                      onClick={() => downloadPdf(documento)}
                    />
                  ) : null}
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="descargar"
                      label={t("tankCalibrationDownloadDetail")}
                      icon={<IconFileTypeXls size={16} color="#217346" />}
                      disabled={Boolean(downloading)}
                      onClick={() => downloadDetail(documento)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noTankCalibrationsFound")}</Text>
        )}
      </div>
    </>
  );

  return (
    <section className={styles.root}>
      {queryError ? <MessageBar intent="error">{queryError}</MessageBar> : null}
      {templateError ? <MessageBar intent="error">{templateError}</MessageBar> : null}
      {downloadError ? <MessageBar intent="error">{downloadError}</MessageBar> : null}
      {tieneTanqueSeleccionado ? renderListadoDetalles() : renderSelectorTanques()}
    </section>
  );
}

export default CapacidadVolumetricaTanqueListPage;
