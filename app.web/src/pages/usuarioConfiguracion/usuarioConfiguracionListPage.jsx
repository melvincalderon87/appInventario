import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { UsuarioConfiguracionService } from "../../services/usuarioConfiguracionService";
import {
  getUsuarioConfiguracionThemeStyles,
  useUsuarioConfiguracionStyles,
} from "../../styles/pages/usuarioConfiguracion/usuarioConfiguracionPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function UsuarioConfiguracionListPage() {
  const styles = useUsuarioConfiguracionStyles();
  const themeStyles = getUsuarioConfiguracionThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idUsuario = "" } = useParams();
  const [searchParams] = useSearchParams();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codUsuario:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const returnToDefault = "/usuario/listar";
  const returnTo = (() => {
    const fromQuery = searchParams.get("returnTo");
    if (!fromQuery) {
      return returnToDefault;
    }

    try {
      return decodeURIComponent(fromQuery) || returnToDefault;
    } catch {
      return fromQuery;
    }
  })();
  const returnQuery = encodeURIComponent(returnTo);

  const configuracionesQuery = useQuery({
    queryKey: ["usuario-configuracion-listado", idUsuario, page, pageSize, search, sort],
    queryFn: () => UsuarioConfiguracionService.listado(idUsuario, params),
    enabled: Boolean(idUsuario),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const configuracionesPage = configuracionesQuery.data ?? emptyPagedResult;
  const configuraciones = useMemo(
    () => (Array.isArray(configuracionesPage.items) ? configuracionesPage.items : []),
    [configuracionesPage.items]
  );
  const loading = configuracionesQuery.isLoading;
  const busy = configuracionesQuery.isFetching;
  const error = configuracionesQuery.isError
    ? configuracionesQuery.error?.message || t("userConfigurationListLoadError")
    : "";

  const goTo = (route, configuracion) => {
    const idUsuario = encodeURIComponent(configuracion.idUsuario || "");
    navigate(`${route}/${idUsuario}?returnTo=${returnQuery}`);
  };
  const goBack = () => navigate(returnTo);
  const tienePermisoAgregar = tienePermiso("agregar");
  const hasConfiguracion = configuraciones.length > 0;

  const encodedIdUsuario = encodeURIComponent(idUsuario);

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("userConfigurationListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("userConfigurationListCount", {
              count: configuracionesPage.totalCount,
            })}
          </Text>
        </div>
        <div className={styles.headerActions}>
          {tienePermisoAgregar ? (
            <ListActionButton
              action="agregar"
              label={t("add")}
              text={t("add")}
              disabled={hasConfiguracion}
              onClick={() => {
                if (!hasConfiguracion) {
                  navigate(
                    `/usuarioconfiguracion/agregar/${encodedIdUsuario}?returnTo=${returnQuery}`
                  );
                }
              }}
            />
          ) : null}
          <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={goBack} />
        </div>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchUsers")}
          aria-label={t("searchUsers")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={configuracionesPage.page}
          pageSize={configuracionesPage.pageSize}
          totalCount={configuracionesPage.totalCount}
          totalPages={configuracionesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingUserConfiguration")} />
          </div>
        ) : configuraciones.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("userConfigurationListTitle")}>
            {configuraciones.map((configuracion) => (
              <article
                key={configuracion.idUsuario || configuracion.codUsuario}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("userCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {configuracion.codUsuario}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("userConfigurationTypeUser")}</Text>
                      <Text className={styles.userName}>{configuracion.tipoUsuario || "-"}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.cardField}>
                  <Text className={styles.metaLabel}>{t("userConfigurationRole")}</Text>
                  <Text className={styles.userName}>{configuracion.rol || "-"}</Text>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/usuarioconfiguracion/visualizar", configuracion)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/usuarioconfiguracion/editar", configuracion)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/usuarioconfiguracion/eliminar", configuracion)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/usuarioconfiguracion/log", configuracion)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noUserConfigurationsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default UsuarioConfiguracionListPage;
