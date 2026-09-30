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
import { TipoPermisoService } from "../../services/tipoPermisoService";
import {
  getTipoPermisoThemeStyles,
  useTipoPermisoStyles,
} from "../../styles/pages/tipoPermiso/tipoPermisoPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function TipoPermisoListPage() {
  const styles = useTipoPermisoStyles();
  const themeStyles = getTipoPermisoThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codTipoPermiso:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const tiposPermisoQuery = useQuery({
    queryKey: ["tipos-permiso-listado", page, pageSize, search, sort],
    queryFn: () => TipoPermisoService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const tiposPermisoPage = tiposPermisoQuery.data ?? emptyPagedResult;
  const tiposPermiso = useMemo(
    () => (Array.isArray(tiposPermisoPage.items) ? tiposPermisoPage.items : []),
    [tiposPermisoPage.items]
  );
  const loading = tiposPermisoQuery.isLoading;
  const busy = tiposPermisoQuery.isFetching;
  const error = tiposPermisoQuery.isError
    ? tiposPermisoQuery.error?.message || t("permissionTypeListLoadError")
    : "";

  const goTo = (route, tipoPermiso) => {
    navigate(`${route}/${encodeURIComponent(tipoPermiso.idTipoPermiso)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("permissionTypeListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("permissionTypeListCount", {
              count: tiposPermisoPage.totalCount,
            })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/tipopermiso/agregar")}
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
          placeholder={t("searchPermissionTypes")}
          aria-label={t("searchPermissionTypes")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={tiposPermisoPage.page}
          pageSize={tiposPermisoPage.pageSize}
          totalCount={tiposPermisoPage.totalCount}
          totalPages={tiposPermisoPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingPermissionTypes")} />
          </div>
        ) : tiposPermiso.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("permissionTypeListTitle")}>
            {tiposPermiso.map((tipoPermiso) => (
              <article
                key={tipoPermiso.idTipoPermiso || tipoPermiso.codTipoPermiso}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("permissionTypeCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {tipoPermiso.codTipoPermiso}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("permissionTypeDescription")}</Text>
                      <Text className={styles.userName}>{tipoPermiso.descripcion}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/tipopermiso/visualizar", tipoPermiso)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/tipopermiso/editar", tipoPermiso)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/tipopermiso/eliminar", tipoPermiso)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/tipopermiso/log", tipoPermiso)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noPermissionTypesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default TipoPermisoListPage;
