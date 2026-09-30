import { useMemo } from "react";
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
import { useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
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
import { TuberiaService } from "../../services/tuberiaService";
import {
  getTuberiaThemeStyles,
  useTuberiaStyles,
} from "../../styles/pages/tuberia/tuberiaPageStyles";
import { emptyPagedResult } from "../../utils/pagination";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const chartColors = [
  "#2563eb",
  "#0f766e",
  "#d97706",
  "#be123c",
  "#4f46e5",
  "#15803d",
  "#b45309",
  "#0369a1",
];

function movementLabel(tipoMovimiento, t) {
  const value = String(tipoMovimiento ?? "")
    .trim()
    .toUpperCase();
  if (value === "ENTRADA") return t("pipelineMovementEntry");
  if (value === "SALIDA") return t("pipelineMovementExit");
  if (value === "NO APLICA") return t("pipelineMovementNotApplicable");
  return "-";
}

function TuberiaListPage() {
  const styles = useTuberiaStyles();
  const themeStyles = getTuberiaThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codTuberia:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const tuberiasQuery = useQuery({
    queryKey: ["tuberias-listado", page, pageSize, search, sort],
    queryFn: () => TuberiaService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const resumenQuery = useQuery({
    queryKey: ["tuberias-resumen-producto"],
    queryFn: () => TuberiaService.resumenPorProducto(),
    staleTime: 0,
  });
  const tuberiasPage = tuberiasQuery.data ?? emptyPagedResult;
  const tuberias = useMemo(
    () => (Array.isArray(tuberiasPage.items) ? tuberiasPage.items : []),
    [tuberiasPage.items]
  );
  const loading = tuberiasQuery.isLoading;
  const busy = tuberiasQuery.isFetching;
  const error = tuberiasQuery.isError
    ? tuberiasQuery.error?.message || t("pipelineListLoadError")
    : "";
  const resumen = useMemo(
    () => (Array.isArray(resumenQuery.data) ? resumenQuery.data : []),
    [resumenQuery.data]
  );
  const resumenError = resumenQuery.isError
    ? resumenQuery.error?.message || t("pipelineSummaryLoadError")
    : "";
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language || "es-GT", { maximumFractionDigits: 2 }),
    [i18n.language]
  );
  const chartData = useMemo(
    () => ({
      labels: resumen.map((item) => item.producto || t("pipelineProduct")),
      datasets: [
        {
          label: t("pipelineSummaryChartLabel"),
          data: resumen.map((item) => Number(item.volumenTotal || 0)),
          backgroundColor: resumen.map((_, index) => chartColors[index % chartColors.length]),
          borderRadius: 4,
          maxBarThickness: 48,
        },
      ],
    }),
    [resumen, t]
  );
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${t("pipelineTotalVolume")}: ${numberFormatter.format(context.parsed.y || 0)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 0,
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => numberFormatter.format(value),
          },
        },
      },
    }),
    [numberFormatter, t]
  );

  const goTo = (route, tuberia) => {
    navigate(`${route}/${encodeURIComponent(tuberia.idTuberia)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("pipelineListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("pipelineListCount", { count: tuberiasPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/tuberia/agregar")}
          />
        ) : null}
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <section className={styles.summarySurface} style={themeStyles.surface}>
        <div className={styles.summaryHeader}>
          <Text as="h3" className={styles.summaryTitle}>
            {t("pipelineSummaryTitle")}
          </Text>
          {resumenQuery.isFetching ? <Spinner label={t("loadingPipelineSummary")} /> : null}
        </div>

        {resumenError ? <MessageBar intent="error">{resumenError}</MessageBar> : null}

        {resumenError ? null : resumenQuery.isLoading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingPipelineSummary")} />
          </div>
        ) : resumen.length > 0 ? (
          <>
            <div className={styles.chartWrap}>
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div className={styles.summaryTableWrap}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>{t("pipelineProduct")}</TableHeaderCell>
                    <TableHeaderCell>{t("pipelineCount")}</TableHeaderCell>
                    <TableHeaderCell>{t("pipelineTotalVolume")}</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumen.map((item) => (
                    <TableRow key={item.idProducto || item.codProducto || item.producto}>
                      <TableCell>{item.producto || "-"}</TableCell>
                      <TableCell className={styles.numericCell}>
                        {numberFormatter.format(item.cantidadTuberias || 0)}
                      </TableCell>
                      <TableCell className={styles.numericCell}>
                        {numberFormatter.format(item.volumenTotal || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <Text className={styles.empty}>{t("pipelineSummaryNoData")}</Text>
        )}
      </section>

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchPipelines")}
          aria-label={t("searchPipelines")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={tuberiasPage.page}
          pageSize={tuberiasPage.pageSize}
          totalCount={tuberiasPage.totalCount}
          totalPages={tuberiasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingPipelines")} />
          </div>
        ) : tuberias.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("pipelineListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("pipelineCode"), sortKey: "codTuberia" },
                  { label: t("pipelineProductType"), sortKey: "tipoProducto" },
                  { label: t("pipelineProduct"), sortKey: "producto" },
                ]}
              />
            ) : null}
            {tuberias.map((tuberia) => (
              <article
                key={tuberia.idTuberia || tuberia.codTuberia}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {tuberia.codTuberia}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineProductType")}</Text>
                      <Text className={styles.userName}>{tuberia.tipoProducto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineProduct")}</Text>
                      <Text className={styles.userName}>{tuberia.producto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineTank")}</Text>
                      <Text className={styles.userName}>{tuberia.tanque || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineCertificationDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDateByLanguage(tuberia.fechaCertificacion, i18n.language)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineMovementType")}</Text>
                      <Text className={styles.userName}>
                        {movementLabel(tuberia.tipoMovimiento, t)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineDiameterStart")}</Text>
                      <Text className={styles.userName}>
                        {numberFormatter.format(tuberia.diametroInicio || 0)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineDiameterEnd")}</Text>
                      <Text className={styles.userName}>
                        {numberFormatter.format(tuberia.diametroFinal || 0)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("pipelineStatus")}</Text>
                      <Text className={styles.userName}>
                        {t(tuberia.estatus !== false ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/tuberia/visualizar", tuberia)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/tuberia/editar", tuberia)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/tuberia/eliminar", tuberia)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/tuberia/log", tuberia)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noPipelinesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default TuberiaListPage;
