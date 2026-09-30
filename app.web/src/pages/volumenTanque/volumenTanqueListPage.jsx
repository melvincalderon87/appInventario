import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { useState } from "react";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { ListViewModeToggle } from "../../components/common/ListViewModeToggle";
import { MasterListTableHeader } from "../../components/common/MasterListTableHeader";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { VolumenTanqueService } from "../../services/volumenTanqueService";
import {
  getVolumenTanqueThemeStyles,
  useVolumenTanqueStyles,
} from "../../styles/pages/volumenTanque/volumenTanquePageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { emptyPagedResult } from "../../utils/pagination";

const linkIconUrl = assetUrl("images/Link.svg");

function formatDecimal(value, language) {
  const numberValue = Number(value ?? 0);
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(Number.isFinite(numberValue) ? numberValue : 0);
}

function formatMeasurement(volumenTanque) {
  const pies = Number(volumenTanque?.pies ?? 0);
  const pulgadas = Number(volumenTanque?.pulgadas ?? 0);
  const dieciseisavos = Number(volumenTanque?.dieciseisavos ?? 0);
  const fraccion = dieciseisavos > 0 ? ` ${dieciseisavos}/16` : "";
  return `${pies}' ${pulgadas}${fraccion}"`;
}

function VolumenTanqueLink({ idVolumenTanque, codDocumento }) {
  const styles = useVolumenTanqueStyles();

  if (!codDocumento) return "";
  if (!idVolumenTanque) return codDocumento;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/volumentanque/visualizar/${encodeURIComponent(idVolumenTanque)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codDocumento}</span>
    </span>
  );
}

function VolumenTanqueListPage() {
  const styles = useVolumenTanqueStyles();
  const themeStyles = getVolumenTanqueThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("fecha:desc", 20);
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);

  const volumenesQuery = useQuery({
    queryKey: ["volumen-tanque-listado", page, pageSize, search, sort],
    queryFn: () => VolumenTanqueService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  const volumenesPage = volumenesQuery.data ?? emptyPagedResult;
  const volumenes = useMemo(
    () => (Array.isArray(volumenesPage.items) ? volumenesPage.items : []),
    [volumenesPage.items]
  );

  const loading = volumenesQuery.isLoading;
  const busy = volumenesQuery.isFetching;
  const error = volumenesQuery.isError
    ? volumenesQuery.error?.message || t("tankVolumeListLoadError")
    : "";

  const goTo = (route, volumenTanque) => {
    navigate(`${route}/${encodeURIComponent(volumenTanque.idVolumenTanque)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("tankVolumeListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("tankVolumeListCount", { count: volumenesPage.totalCount })}
          </Text>
        </div>
        <div className={styles.actions}>
          {tienePermiso("agregar") ? (
            <ListActionButton
              action="agregar"
              label={t("add")}
              text={t("add")}
              onClick={() => navigate("/volumentanque/agregar")}
            />
          ) : null}
        </div>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchTankVolumes")}
          aria-label={t("searchTankVolumes")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={volumenesPage.page}
          pageSize={volumenesPage.pageSize}
          totalCount={volumenesPage.totalCount}
          totalPages={volumenesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingTankVolumes")} />
          </div>
        ) : volumenes.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("tankVolumeListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("tankVolumeDocument"), sortKey: "documento" },
                  { label: t("tankVolumeDate"), sortKey: "fecha" },
                  { label: t("tankVolumeTank"), sortKey: "tanque" },
                ]}
              />
            ) : null}
            {volumenes.map((volumenTanque) => (
              <article
                key={volumenTanque.idVolumenTanque || volumenTanque.codDocumento}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankVolumeDocument")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        <VolumenTanqueLink
                          idVolumenTanque={volumenTanque.idVolumenTanque}
                          codDocumento={volumenTanque.codDocumento}
                        />
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankVolumeDate")}</Text>
                      <Text className={styles.userName}>
                        {formatDateByLanguage(volumenTanque.fecha, i18n.language)}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankVolumeTank")}</Text>
                      <Text className={styles.userName}>
                        {volumenTanque.tanque || volumenTanque.codTanque}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankVolumeMeasurement")}</Text>
                      <Text className={styles.userName}>{formatMeasurement(volumenTanque)}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("tankVolumeVolume")}</Text>
                      <Text className={styles.userName}>
                        {formatDecimal(volumenTanque.volumen, i18n.language)}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/volumentanque/visualizar", volumenTanque)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/volumentanque/editar", volumenTanque)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/volumentanque/eliminar", volumenTanque)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/volumentanque/log", volumenTanque)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noTankVolumesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default VolumenTanqueListPage;
