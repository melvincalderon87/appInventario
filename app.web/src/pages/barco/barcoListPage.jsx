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
import { BarcoService } from "../../services/barcoService";
import { getBarcoThemeStyles, useBarcoStyles } from "../../styles/pages/barco/barcoPageStyles";
import { formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

function formatDecimal(value, language) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat(language || "es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function BarcoListPage() {
  const styles = useBarcoStyles();
  const themeStyles = getBarcoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codBarco:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const barcosQuery = useQuery({
    queryKey: ["barco-listado", page, pageSize, search, sort],
    queryFn: () => BarcoService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const barcosPage = barcosQuery.data ?? emptyPagedResult;
  const barcos = useMemo(
    () => (Array.isArray(barcosPage.items) ? barcosPage.items : []),
    [barcosPage.items]
  );
  const loading = barcosQuery.isLoading;
  const busy = barcosQuery.isFetching;
  const error = barcosQuery.isError ? barcosQuery.error?.message || t("shipListLoadError") : "";

  const goTo = (route, barco) => {
    navigate(`${route}/${encodeURIComponent(barco.idBarco)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("shipListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("shipListCount", { count: barcosPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/barco/agregar")}
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
          placeholder={t("searchShips")}
          aria-label={t("searchShips")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={barcosPage.page}
          pageSize={barcosPage.pageSize}
          totalCount={barcosPage.totalCount}
          totalPages={barcosPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingShips")} />
          </div>
        ) : barcos.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("shipListTitle")}>
            {barcos.map((barco) => (
              <article
                key={barco.idBarco || barco.codBarco}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("shipCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {barco.codBarco}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("shipName")}</Text>
                      <Text className={styles.userName}>{barco.barco}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("shipExpectedDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDateFilterByLanguage(barco.fechaPrevista, i18n.language)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("shipComment")}</Text>
                      <Text className={styles.userName}>{barco.comentario || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("shipDetailRows")}</Text>
                      <Text className={styles.userName}>{barco.detalleCantidad ?? 0}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("shipTotalQuantity")}</Text>
                      <Text className={styles.userName}>
                        {formatDecimal(barco.cantidadTotal, i18n.language)}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/barco/visualizar", barco)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/barco/editar", barco)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/barco/eliminar", barco)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/barco/log", barco)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noShipsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default BarcoListPage;
