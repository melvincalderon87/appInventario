import { useMemo, useState } from "react";
import { Input, MessageBar, Select, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { ArrowRight, Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { AditivoService } from "../../services/aditivoService";
import {
  getAditivoThemeStyles,
  useAditivoStyles,
} from "../../styles/pages/aditivo/aditivoPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const COLUMNS = [
  { key: "fecha", width: 130 },
  { key: "codDocumento", width: 150 },
  { key: "tipoMovimiento", width: 130 },
  { key: "codProducto", width: 120 },
  { key: "producto", width: 220 },
  { key: "cantidad", width: 130 },
  { key: "acciones", width: 160 },
];

const ACCIONES_POR_PANTALLA = {
  INGRESO: { ingreso: true, salida: false },
  SALIDA: { ingreso: false, salida: true },
};

function getDocumentCode(aditivo) {
  if (aditivo?.codDocumento === undefined || aditivo?.codDocumento === null) return "";

  return aditivo.codDocumento;
}

function formatDecimal(value, language) {
  const numberValue = Number(value ?? 0);
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

function movimientoLabel(value, t) {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "SALIDA") return t("additiveMovementOut");
  return t("additiveMovementIn");
}

function cantidadRender(aditivo) {
  const valor = Number(aditivo?.cantidad ?? 0);
  if (
    String(aditivo?.tipoMovimiento ?? "")
      .trim()
      .toUpperCase() === "SALIDA"
  ) {
    return -Math.abs(Number.isFinite(valor) ? valor : 0);
  }

  return Math.abs(Number.isFinite(valor) ? valor : 0);
}

function DocumentCodeLink({ idAditivo, code }) {
  const styles = useAditivoStyles();

  if (code === undefined || code === null || String(code).trim() === "") return "-";
  if (!idAditivo) return <span>{code}</span>;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/aditivo/visualizar/${encodeURIComponent(idAditivo)}`}
      >
        <ArrowRight size={14} color="#d97706" />
      </Link>
      <span>{code}</span>
    </span>
  );
}

function AditivoListPage({ tipoMovimientoInicial = "", titulo = null }) {
  const styles = useAditivoStyles();
  const themeStyles = getAditivoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const [tipoMovimiento, setTipoMovimiento] = useState(tipoMovimientoInicial);
  const accionesPantalla = ACCIONES_POR_PANTALLA[tipoMovimientoInicial];
  const mostrarAccionIngreso = accionesPantalla
    ? accionesPantalla.ingreso
    : tipoMovimiento !== "SALIDA";
  const mostrarAccionSalida = accionesPantalla
    ? accionesPantalla.salida
    : false;
  const pagination = useServerPagination("fecha:desc");
  const { page, pageSize, search, sort, params, setSearch, setPage } = pagination;

  const aditivosQuery = useQuery({
    queryKey: ["aditivo-listado", page, pageSize, search, sort, tipoMovimiento],
    queryFn: () =>
      AditivoService.listado({
        ...params,
        pageSize: 20,
        tipoMovimiento,
      }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const aditivosPage = aditivosQuery.data ?? emptyPagedResult;
  const aditivos = useMemo(
    () => (Array.isArray(aditivosPage.items) ? aditivosPage.items : []),
    [aditivosPage.items]
  );

  const goTo = (route, aditivo) => {
    navigate(`${route}/${encodeURIComponent(aditivo.idAditivo)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{titulo || t("additiveListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("additiveListCount", { count: aditivosPage.totalCount })}
          </Text>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {tienePermiso("agregar") ? (
            <>
              {mostrarAccionIngreso ? (
                <ListActionButton
                  action="ingreso"
                  label={t("additiveEntryAction")}
                  text={t("additiveEntryAction")}
                  onClick={() => navigate("/aditivo/ingreso")}
                />
              ) : null}
              {mostrarAccionSalida ? (
                <ListActionButton
                  action="salida"
                  label={t("additiveExitAction")}
                  text={t("additiveExitAction")}
                  onClick={() => navigate("/aditivo/salida")}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {aditivosQuery.isError ? (
        <MessageBar intent="error">
          {aditivosQuery.error?.message || t("additiveListLoadError")}
        </MessageBar>
      ) : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <div className={styles.modificationSearchRow}>
          <Input
            className={styles.searchInput}
            value={search}
            onChange={(_, data) => setSearch(data.value)}
            contentBefore={<Search />}
            placeholder={t("searchAdditives")}
            aria-label={t("searchAdditives")}
          />
          {!tipoMovimientoInicial ? (
            <div className={styles.modificationFilterGrid}>
              <Select
                value={tipoMovimiento}
                onChange={(_, data) => {
                  setTipoMovimiento(String(data.value || ""));
                  setPage(1);
                }}
              >
                <option value="">{t("additiveMovementFilterAll")}</option>
                <option value="INGRESO">{t("additiveMovementIn")}</option>
                <option value="SALIDA">{t("additiveMovementOut")}</option>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.listSurface}>
        {aditivosQuery.isLoading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingAdditives")} />
          </div>
        ) : aditivos.length > 0 ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table
                className={styles.menuTable}
                style={{ minWidth: "1000px" }}
                aria-label={t("additiveListTitle")}
              >
                <colgroup>
                  {COLUMNS.map((column) => (
                    <col key={column.key} style={{ width: `${column.width}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th className={`${styles.menuHeaderCell} ${styles.menuCodeCell}`}>
                      <span className={styles.menuHeaderContent}>{t("additiveDate")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("additiveCode")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("additiveMovement")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("additiveProductCode")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("additiveProduct")}</span>
                    </th>
                    <th className={`${styles.menuHeaderCell} ${styles.tableCellNoWrap}`}>
                      <span className={styles.menuHeaderContent}>
                        {t("additiveQuantityGallons")}
                      </span>
                    </th>
                    <th className={`${styles.menuHeaderCell} ${styles.menuActionsCell}`}>
                      <span className={styles.menuHeaderContent}>{t("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aditivos.map((aditivo) => {
                    const movement = String(aditivo.tipoMovimiento ?? "")
                      .trim()
                      .toUpperCase();
                    const documentCode = getDocumentCode(aditivo);

                    return (
                      <tr key={aditivo.idAditivo || documentCode} className={styles.menuRow}>
                        <td className={styles.menuCell}>
                          {formatDateFilterByLanguage(aditivo.fecha, i18n.language)}
                        </td>
                        <td className={styles.menuCell}>
                          <DocumentCodeLink idAditivo={aditivo.idAditivo} code={documentCode} />
                        </td>
                        <td className={styles.menuCell}>{movimientoLabel(movement, t)}</td>
                        <td className={styles.menuCell}>
                          <span className={styles.tableCellExpanded}>
                            {aditivo.codProducto || "-"}
                          </span>
                        </td>
                        <td className={styles.menuCell}>
                          <span className={styles.tableCellExpanded}>
                            {aditivo.producto || "-"}
                          </span>
                        </td>
                        <td className={styles.menuCell}>
                          <span className={styles.tableCellNoWrap}>
                            {formatDecimal(cantidadRender(aditivo), i18n.language)}
                          </span>
                        </td>
                        <td className={`${styles.menuCell} ${styles.menuActionsCell}`}>
                          <div className={styles.actionCell}>
                            <div className={styles.tableActions}>
                              {tienePermiso("visualizar") ? (
                                <ListActionButton
                                  action="visualizar"
                                  label={t("view")}
                                  onClick={() => goTo("/aditivo/visualizar", aditivo)}
                                />
                              ) : null}
                              {tienePermiso("editar") ? (
                                <ListActionButton
                                  action="editar"
                                  label={t("edit")}
                                  onClick={() => goTo("/aditivo/editar", aditivo)}
                                />
                              ) : null}
                              {tienePermiso("eliminar") ? (
                                <ListActionButton
                                  action="eliminar"
                                  label={t("delete")}
                                  onClick={() => goTo("/aditivo/eliminar", aditivo)}
                                />
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={styles.empty}>{t("noAdditivesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default AditivoListPage;
