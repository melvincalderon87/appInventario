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
import { ConsumoPropioService } from "../../services/consumoPropioService";
import { TanqueService } from "../../services/tanqueService";
import {
  getConsumoPropioThemeStyles,
  useConsumoPropioStyles,
} from "../../styles/pages/consumoPropio/consumoPropioPageStyles";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { formatHeightMeasurement } from "../../utils/heightMeasurement";
import { emptyPagedResult } from "../../utils/pagination";

function formatDecimal(value, language) {
  const numberValue = Number(value ?? 0);
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

function measurement(consumo) {
  return formatHeightMeasurement(consumo);
}

function movementKey(consumo) {
  return Number(consumo.cantidad ?? 0) < 0
    ? "ownConsumptionMovementOut"
    : "ownConsumptionMovementIn";
}

function ConsumoPropioListPage() {
  const styles = useConsumoPropioStyles();
  const themeStyles = getConsumoPropioThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idTanque = "" } = useParams();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("fecha:desc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const tieneTanqueSeleccionado = Boolean(idTanque);
  const tankFilter = { consumoPropio: true, tipoProducto: "Combustible" };

  const tanquesQuery = useQuery({
    queryKey: ["consumo-propio-selector-tanques", page, pageSize, search, sort],
    queryFn: () => TanqueService.listado({ ...params, ...tankFilter }),
    enabled: !tieneTanqueSeleccionado,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const tanqueQuery = useQuery({
    queryKey: ["consumo-propio-tanque-seleccionado", idTanque],
    queryFn: () => TanqueService.obtener(idTanque),
    enabled: tieneTanqueSeleccionado,
    staleTime: 0,
  });

  const consumosQuery = useQuery({
    queryKey: ["consumo-propio-listado", idTanque, page, pageSize, search, sort],
    queryFn: () => ConsumoPropioService.listado({ ...params, idTanque }),
    enabled: tieneTanqueSeleccionado,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const tanquesPage = tanquesQuery.data ?? emptyPagedResult;
  const tanques = useMemo(
    () => (Array.isArray(tanquesPage.items) ? tanquesPage.items : []),
    [tanquesPage.items]
  );

  const consumosPage = consumosQuery.data ?? emptyPagedResult;
  const consumos = useMemo(
    () => (Array.isArray(consumosPage.items) ? consumosPage.items : []),
    [consumosPage.items]
  );

  const selectedTank = tanqueQuery.data;
  const selectedTankName = selectedTank?.tanque || t("ownConsumptionSelectedTankFallback");
  const loading = tieneTanqueSeleccionado
    ? consumosQuery.isLoading || tanqueQuery.isLoading
    : tanquesQuery.isLoading;
  const busy = tieneTanqueSeleccionado
    ? consumosQuery.isFetching || tanqueQuery.isFetching
    : tanquesQuery.isFetching;
  const error = tieneTanqueSeleccionado
    ? (tanqueQuery.isError ? tanqueQuery.error?.message || t("tankLoadError") : "") ||
      (consumosQuery.isError
        ? consumosQuery.error?.message || t("ownConsumptionListLoadError")
        : "")
    : tanquesQuery.isError
      ? tanquesQuery.error?.message || t("tankListLoadError")
      : "";

  const goTo = (route, consumo) => {
    navigate(`${route}/${encodeURIComponent(consumo.idConsumoPropio)}`);
  };

  const renderSelectorTanques = () => (
    <>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("ownConsumptionSelectTankTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("tankListCount", { count: tanquesPage.totalCount })}
          </Text>
        </div>
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
          <div className={styles.cardGrid} aria-label={t("ownConsumptionSelectTankTitle")}>
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
                      <Text className={styles.metaLabel}>{t("tankName")}</Text>
                      <Text className={styles.userName}>{tanque.tanque}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankShortDescription")}</Text>
                      <Text className={styles.userName}>{tanque.descripcionCorta}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankProduct")}</Text>
                      <Text className={styles.userName}>{tanque.producto}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <ListActionButton
                    action="visualizar"
                    label={t("ownConsumptionSelectTankAction")}
                    text={t("ownConsumptionSelectTankAction")}
                    onClick={() =>
                      navigate(`/consumopropio/listar/${encodeURIComponent(tanque.idTanque)}`)
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

  const renderListadoConsumos = () => (
    <>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>
            {t("ownConsumptionTankListTitle", { tank: selectedTankName })}
          </Title2>
          <Text className={styles.subtitle}>
            {t("ownConsumptionListCount", { count: consumosPage.totalCount })}
          </Text>
        </div>
        <div className={styles.actions}>
          <ListActionButton
            action="regresar"
            label={t("back")}
            text={t("back")}
            onClick={() => navigate("/consumopropio/listar")}
          />
          {tienePermiso("agregar") ? (
            <ListActionButton
              action="agregar"
              label={t("add")}
              text={t("add")}
              onClick={() => navigate(`/consumopropio/agregar/${encodeURIComponent(idTanque)}`)}
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
          placeholder={t("searchOwnConsumptions")}
          aria-label={t("searchOwnConsumptions")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={consumosPage.page}
          pageSize={consumosPage.pageSize}
          totalCount={consumosPage.totalCount}
          totalPages={consumosPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingOwnConsumptions")} />
          </div>
        ) : consumos.length > 0 ? (
          <div
            className={styles.cardGrid}
            aria-label={t("ownConsumptionTankListTitle", { tank: selectedTankName })}
          >
            {consumos.map((consumo) => (
              <article
                key={consumo.idConsumoPropio || consumo.codConsumoPropio}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ownConsumptionCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {consumo.codConsumoPropio}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ownConsumptionDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDateByLanguage(consumo.fecha, i18n.language)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ownConsumptionMeasurement")}</Text>
                      <Text className={styles.userName}>{measurement(consumo)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ownConsumptionQuantity")}</Text>
                      <Text className={styles.userName}>
                        {formatDecimal(consumo.cantidad, i18n.language)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ownConsumptionMovement")}</Text>
                      <Text className={styles.userName}>{t(movementKey(consumo))}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("ownConsumptionCurrentQuantity")}</Text>
                      <Text className={styles.userName}>
                        {formatDecimal(consumo.cantidadActual, i18n.language)}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/consumopropio/visualizar", consumo)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/consumopropio/editar", consumo)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/consumopropio/eliminar", consumo)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/consumopropio/log", consumo)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noOwnConsumptionsFound")}</Text>
        )}
      </div>
    </>
  );

  return (
    <section className={styles.root}>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {tieneTanqueSeleccionado ? renderListadoConsumos() : renderSelectorTanques()}
    </section>
  );
}

export default ConsumoPropioListPage;
