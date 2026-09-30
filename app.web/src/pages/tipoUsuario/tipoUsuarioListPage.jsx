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
import { TipoUsuarioService } from "../../services/tipoUsuarioService";
import {
  getTipoUsuarioThemeStyles,
  useTipoUsuarioStyles,
} from "../../styles/pages/tipoUsuario/tipoUsuarioPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function TipoUsuarioListPage() {
  const styles = useTipoUsuarioStyles();
  const themeStyles = getTipoUsuarioThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codTipoUsuario:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const tiposUsuarioQuery = useQuery({
    queryKey: ["tipos-usuario-listado", page, pageSize, search, sort],
    queryFn: () => TipoUsuarioService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const tiposUsuarioPage = tiposUsuarioQuery.data ?? emptyPagedResult;
  const tiposUsuario = useMemo(
    () => (Array.isArray(tiposUsuarioPage.items) ? tiposUsuarioPage.items : []),
    [tiposUsuarioPage.items]
  );
  const loading = tiposUsuarioQuery.isLoading;
  const busy = tiposUsuarioQuery.isFetching;
  const error = tiposUsuarioQuery.isError
    ? tiposUsuarioQuery.error?.message || t("userTypeListLoadError")
    : "";

  const goTo = (route, tipoUsuario) => {
    navigate(`${route}/${encodeURIComponent(tipoUsuario.idTipoUsuario)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("userTypeListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("userTypeListCount", { count: tiposUsuarioPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/tipousuario/agregar")}
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
          placeholder={t("searchUserTypes")}
          aria-label={t("searchUserTypes")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={tiposUsuarioPage.page}
          pageSize={tiposUsuarioPage.pageSize}
          totalCount={tiposUsuarioPage.totalCount}
          totalPages={tiposUsuarioPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingUserTypes")} />
          </div>
        ) : tiposUsuario.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("userTypeListTitle")}>
            {tiposUsuario.map((tipoUsuario) => (
              <article
                key={tipoUsuario.idTipoUsuario || tipoUsuario.codTipoUsuario}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("userTypeCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {tipoUsuario.codTipoUsuario}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("userTypeDescription")}</Text>
                      <Text className={styles.userName}>{tipoUsuario.descripcion}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/tipousuario/visualizar", tipoUsuario)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/tipousuario/editar", tipoUsuario)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/tipousuario/eliminar", tipoUsuario)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/tipousuario/log", tipoUsuario)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noUserTypesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default TipoUsuarioListPage;
