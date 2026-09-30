import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Input, MessageBar, Select, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { ColoranteService } from "../../services/coloranteService";
import {
  getColoranteThemeStyles,
  useColoranteStyles,
} from "../../styles/pages/colorante/colorantePageStyles";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const COLUMNS = [
  { key: "fecha", width: 130 },
  { key: "codDocumento", width: 140 },
  { key: "tipoMovimiento", width: 160 },
  { key: "codProducto", width: 130 },
  { key: "producto", width: 220 },
  { key: "cantidad", width: 150 },
  { key: "acciones", width: 170 },
];

const ACCIONES_POR_PANTALLA = {
  INGRESO: { ingreso: true, salida: false },
  SALIDA: { ingreso: false, salida: true },
};

function formatDecimal(value, language) {
  const numberValue = Number(value ?? 0);
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

function isColorantSalidaMovimiento(value) {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  return ["SALIDA", "INYECTAR_MANIFOLD", "PRESTAMO"].includes(raw);
}

function movimientoLabel(value, t) {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (raw === "AJUSTE") return t("colorantMovementAdjust");
  if (raw === "INYECTAR_MANIFOLD") return t("colorantMovementInjection");
  if (raw === "PRESTAMO") return t("colorantMovementLoan");
  if (raw === "SALIDA") return t("colorantMovementOut");
  return t("colorantMovementIn");
}

function cantidadRender(colorante) {
  const valor = Number(colorante?.cantidad ?? 0);
  const numero = Number.isFinite(valor) ? valor : 0;
  const movimiento = String(colorante?.tipoMovimiento ?? "")
    .trim()
    .toUpperCase();
  if (movimiento === "AJUSTE") return numero;

  return isColorantSalidaMovimiento(colorante?.tipoMovimiento)
    ? -Math.abs(numero)
    : Math.abs(numero);
}

function DocumentCodeLink({ idColorante, code }) {
  const styles = useColoranteStyles();

  if (code === undefined || code === null || String(code).trim() === "") return "-";
  if (!idColorante) return <span>{code}</span>;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/colorante/visualizar/${encodeURIComponent(idColorante)}`}
      >
        <ArrowRight size={14} color="#d97706" />
      </Link>
      <span>{code}</span>
    </span>
  );
}

function ColoranteListPage({ tipoMovimientoInicial = "", titulo = null }) {
  const styles = useColoranteStyles();
  const themeStyles = getColoranteThemeStyles();
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
  const { page, search, sort, params, setSearch, setPage } = pagination;

  const colorantesQuery = useQuery({
    queryKey: ["colorante-listado", page, search, sort, tipoMovimiento],
    queryFn: () => {
      const filterValue =
        tipoMovimiento === "INGRESO"
          ? "INGRESO,AJUSTE_POSITIVO"
          : tipoMovimiento === "SALIDA"
            ? "SALIDA,INYECTAR_MANIFOLD,PRESTAMO,AJUSTE_NEGATIVO"
            : "";

      return ColoranteService.listado({
        ...params,
        pageSize: 20,
        tipoMovimiento: filterValue,
      });
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const colorantesPage = colorantesQuery.data ?? emptyPagedResult;
  const colorantes = useMemo(
    () => (Array.isArray(colorantesPage.items) ? colorantesPage.items : []),
    [colorantesPage.items]
  );

  const goTo = (route, colorante) => {
    navigate(`${route}/${encodeURIComponent(colorante.idColorante)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{titulo || t("colorantListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("colorantListCount", { count: colorantesPage.totalCount })}
          </Text>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {tienePermiso("agregar") ? (
            <>
              {mostrarAccionIngreso ? (
                <ListActionButton
                  action="ingreso"
                  label={t("colorantEntryAction")}
                  text={t("colorantEntryAction")}
                  onClick={() => navigate("/colorante/ingreso")}
                />
              ) : null}
              {mostrarAccionSalida ? (
                <ListActionButton
                  action="salida"
                  label={t("colorantExitAction")}
                  text={t("colorantExitAction")}
                  onClick={() => navigate("/colorante/salida")}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {colorantesQuery.isError ? (
        <MessageBar intent="error">
          {colorantesQuery.error?.message || t("colorantListLoadError")}
        </MessageBar>
      ) : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <div className={styles.modificationSearchRow}>
          <Input
            className={styles.searchInput}
            value={search}
            onChange={(_, data) => setSearch(data.value)}
            contentBefore={<Search />}
            placeholder={t("searchColorants")}
            aria-label={t("searchColorants")}
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
                <option value="">{t("colorantMovementFilterAll")}</option>
                <option value="INGRESO">{t("colorantMovementIn")}</option>
                <option value="SALIDA">{t("colorantMovementOut")}</option>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.listSurface}>
        {colorantesQuery.isLoading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingColorants")} />
          </div>
        ) : colorantes.length > 0 ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table
                className={styles.menuTable}
                style={{ minWidth: "960px" }}
                aria-label={t("colorantListTitle")}
              >
                <colgroup>
                  {COLUMNS.map((column) => (
                    <col key={column.key} style={{ width: `${column.width}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("colorantDate")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("colorantCode")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("colorantMovement")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("colorantProductCode")}</span>
                    </th>
                    <th className={styles.menuHeaderCell}>
                      <span className={styles.menuHeaderContent}>{t("colorantProduct")}</span>
                    </th>
                    <th className={`${styles.menuHeaderCell} ${styles.tableCellNoWrap}`}>
                      <span className={styles.menuHeaderContent}>
                        {t("colorantQuantityGallons")}
                      </span>
                    </th>
                    <th className={`${styles.menuHeaderCell} ${styles.menuActionsCell}`}>
                      <span className={styles.menuHeaderContent}>{t("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {colorantes.map((colorante) => (
                    <tr
                      key={colorante.idColorante || String(colorante.codDocumento)}
                      className={styles.menuRow}
                    >
                      <td className={styles.menuCell}>
                        {formatDateByLanguage(colorante.fecha, i18n.language)}
                      </td>
                      <td className={styles.menuCell}>
                        <DocumentCodeLink
                          idColorante={colorante.idColorante}
                          code={colorante.codDocumento}
                        />
                      </td>
                      <td className={styles.menuCell}>
                        {movimientoLabel(colorante.tipoMovimiento, t)}
                      </td>
                      <td className={styles.menuCell}>{colorante.codProducto || "-"}</td>
                      <td className={styles.menuCell}>
                        <span className={styles.tableCellExpanded}>
                          {colorante.producto || "-"}
                        </span>
                      </td>
                      <td className={`${styles.menuCell} ${styles.tableCellNoWrap}`}>
                        {formatDecimal(cantidadRender(colorante), i18n.language)}
                      </td>
                      <td className={`${styles.menuCell} ${styles.menuActionsCell}`}>
                        <div className={styles.actionCell}>
                          <div className={styles.tableActions}>
                            {tienePermiso("visualizar") ? (
                              <ListActionButton
                                action="visualizar"
                                label={t("view")}
                                onClick={() => goTo("/colorante/visualizar", colorante)}
                              />
                            ) : null}
                            {tienePermiso("editar") ? (
                              <ListActionButton
                                action="editar"
                                label={t("edit")}
                                onClick={() => goTo("/colorante/editar", colorante)}
                              />
                            ) : null}
                            {tienePermiso("eliminar") ? (
                              <ListActionButton
                                action="eliminar"
                                label={t("delete")}
                                onClick={() => goTo("/colorante/eliminar", colorante)}
                              />
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={styles.empty}>{t("noColorantsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default ColoranteListPage;
