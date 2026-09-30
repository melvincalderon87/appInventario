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
import { UsuarioPreferenciaService } from "../../services/usuarioPreferenciaService";
import {
  getUsuarioPreferenciaThemeStyles,
  useUsuarioPreferenciaStyles,
} from "../../styles/pages/usuarioPreferencia/usuarioPreferenciaPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function UsuarioPreferenciaListPage() {
  const styles = useUsuarioPreferenciaStyles();
  const themeStyles = getUsuarioPreferenciaThemeStyles();
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

  const preferenciasQuery = useQuery({
    queryKey: ["usuario-preferencia-listado", idUsuario, page, pageSize, search, sort],
    queryFn: () => UsuarioPreferenciaService.listado(idUsuario, params),
    enabled: Boolean(idUsuario),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const preferenciasPage = preferenciasQuery.data ?? emptyPagedResult;
  const preferencias = useMemo(
    () => (Array.isArray(preferenciasPage.items) ? preferenciasPage.items : []),
    [preferenciasPage.items]
  );
  const loading = preferenciasQuery.isLoading;
  const busy = preferenciasQuery.isFetching;
  const error = preferenciasQuery.isError
    ? preferenciasQuery.error?.message || t("userPreferenceListLoadError")
    : "";

  const goTo = (route, preferencia) => {
    navigate(
      `${route}/${encodeURIComponent(preferencia.idUsuario || idUsuario)}?returnTo=${returnQuery}`
    );
  };
  const goBack = () => navigate(returnTo);
  const hasPreferencia = preferencias.length > 0;

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("userPreferenceListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("userPreferenceListCount", {
              count: preferenciasPage.totalCount,
            })}
          </Text>
        </div>
        <div className={styles.headerActions}>
          {tienePermiso("agregar") ? (
            <ListActionButton
              action="agregar"
              label={t("add")}
              text={t("add")}
              disabled={hasPreferencia}
              onClick={() => {
                if (!hasPreferencia) {
                  navigate(
                    `/usuariopreferencia/agregar/${encodeURIComponent(idUsuario)}?returnTo=${returnQuery}`
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
          placeholder={t("searchUserPreferences")}
          aria-label={t("searchUserPreferences")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={preferenciasPage.page}
          pageSize={preferenciasPage.pageSize}
          totalCount={preferenciasPage.totalCount}
          totalPages={preferenciasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingUserPreference")} />
          </div>
        ) : preferencias.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("userPreferenceListTitle")}>
            {preferencias.map((preferencia) => (
              <article
                key={preferencia.idUsuario || preferencia.codUsuario}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("userCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {preferencia.codUsuario}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("language")}</Text>
                      <Text className={styles.userName}>{preferencia.idioma}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.cardField}>
                  <Text className={styles.metaLabel}>{t("theme")}</Text>
                  <Text className={styles.userName}>{preferencia.theme}</Text>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/usuariopreferencia/visualizar", preferencia)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/usuariopreferencia/editar", preferencia)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/usuariopreferencia/eliminar", preferencia)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/usuariopreferencia/log", preferencia)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noUserPreferencesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default UsuarioPreferenciaListPage;
