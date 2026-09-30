import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Input,
  MessageBar,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { useServerPagination } from "../../hooks/useServerPagination";
import { CapacidadVolumetricaTanqueService } from "../../services/capacidadVolumetricaTanqueService";
import {
  getCapacidadVolumetricaTanqueThemeStyles,
  useCapacidadVolumetricaTanqueStyles,
} from "../../styles/pages/capacidadVolumetricaTanque/capacidadVolumetricaTanquePageStyles";
import { emptyPagedResult } from "../../utils/pagination";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";

function formatVolume(value, language) {
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(Number(value ?? 0));
}

function CapacidadVolumetricaTanqueVisualizarPage() {
  const styles = useCapacidadVolumetricaTanqueStyles();
  const themeStyles = getCapacidadVolumetricaTanqueThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idCapacidadVolumetricaTanque = "" } = useParams();
  const pagination = useServerPagination("", 100);
  const { page, pageSize, sort, params, setPage, setPageSize } = pagination;
  const [pies, setPies] = useState("");
  const [pulgadas, setPulgadas] = useState("");
  const [alturaFraccion, setAlturaFraccion] = useState("");
  const filtrosMedida = { pies, pulgadas, dieciseisavos: alturaFraccion };

  const actualizarFiltroMedida = (setFiltro) => (_, data) => {
    setFiltro(data.value);
    setPage(1);
  };

  const summaryQuery = useQuery({
    queryKey: ["capacidad-volumetrica-tanque-resumen", idCapacidadVolumetricaTanque],
    queryFn: () => CapacidadVolumetricaTanqueService.resumen(idCapacidadVolumetricaTanque),
    staleTime: 0,
  });
  const detailsQuery = useQuery({
    queryKey: [
      "capacidad-volumetrica-tanque-detalle",
      idCapacidadVolumetricaTanque,
      page,
      pageSize,
      sort,
      pies,
      pulgadas,
      alturaFraccion,
    ],
    queryFn: () =>
      CapacidadVolumetricaTanqueService.listadoDetalle(idCapacidadVolumetricaTanque, {
        ...params,
        ...filtrosMedida,
      }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const summary = summaryQuery.data;
  const detailPage = detailsQuery.data ?? emptyPagedResult;
  const details = useMemo(
    () => (Array.isArray(detailPage.items) ? detailPage.items : []),
    [detailPage.items]
  );
  const loading = summaryQuery.isLoading || detailsQuery.isLoading;
  const busy = summaryQuery.isFetching || detailsQuery.isFetching;
  const error = summaryQuery.isError
    ? summaryQuery.error?.message || t("tankCalibrationLoadError")
    : detailsQuery.isError
      ? detailsQuery.error?.message || t("tankCalibrationDetailLoadError")
      : "";

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("tankCalibrationViewTitle")}</Title2>
          {summary ? (
            <Text className={styles.subtitle}>
              {summary.tanque || summary.codTanque} · {summary.producto || "-"} ·{" "}
              {formatDateByLanguage(summary.fechaCalibracion, i18n.language)}
            </Text>
          ) : null}
        </div>
        <div className={styles.actions}>
          <ListActionButton
            action="regresar"
            label={t("back")}
            text={t("back")}
            onClick={() => navigate("/capacidadvolumetricatanque/listar")}
          />
        </div>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <div className={styles.measureFilters}>
          <Input
            className={styles.measureFilterInput}
            type="number"
            min="0"
            step="1"
            value={pies}
            onChange={actualizarFiltroMedida(setPies)}
            placeholder={t("tankCalibrationFilterFeet")}
            aria-label={t("tankCalibrationFilterFeet")}
          />
          <Input
            className={styles.measureFilterInput}
            type="number"
            min="0"
            max="11"
            step="1"
            value={pulgadas}
            onChange={actualizarFiltroMedida(setPulgadas)}
            placeholder={t("tankCalibrationFilterInches")}
            aria-label={t("tankCalibrationFilterInches")}
          />
          <Input
            className={styles.measureFilterInput}
            type="number"
            min="0"
            max="15"
            step="1"
            value={alturaFraccion}
            onChange={actualizarFiltroMedida(setAlturaFraccion)}
            placeholder={t("tankCalibrationFilterSixteenths")}
            aria-label={t("tankCalibrationFilterSixteenths")}
          />
        </div>
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={detailPage.page}
          pageSize={detailPage.pageSize}
          totalCount={detailPage.totalCount}
          totalPages={detailPage.totalPages}
          loading={busy}
          showPageSize={false}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingTankCalibrationDetails")} />
          </div>
        ) : details.length > 0 ? (
          <Table className="tank-capacity-details-table" aria-label={t("tankCalibrationDetails")}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("tankCalibrationHeightFeet")} '</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationHeightInches")} &quot;</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationHeightFractionNumerator")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationVolume")}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((row) => (
                <TableRow
                  key={
                    row.idCapacidadVolumetricaTanqueDetalle ||
                    row.codCapacidadVolumetricaTanqueDetalle
                  }
                >
                  <TableCell>{Number(row.pies ?? 0)}'</TableCell>
                  <TableCell>{Number(row.pulgadas ?? 0)}&quot;</TableCell>
                  <TableCell>{Number(row.dieciseisavos ?? 0)}/16</TableCell>
                  <TableCell>{formatVolume(row.volumen, i18n.language)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Text className={styles.empty}>{t("noTankCalibrationDetailsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default CapacidadVolumetricaTanqueVisualizarPage;
