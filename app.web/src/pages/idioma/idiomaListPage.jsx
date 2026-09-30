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
import { IdiomaService } from "../../services/idiomaService";
import { getIdiomaThemeStyles, useIdiomaStyles } from "../../styles/pages/idioma/idiomaPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function IdiomaListPage() {
  const styles = useIdiomaStyles();
  const themeStyles = getIdiomaThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("idioma:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const idiomasQuery = useQuery({
    queryKey: ["idiomas-listado", page, pageSize, search, sort],
    queryFn: () => IdiomaService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const idiomasPage = idiomasQuery.data ?? emptyPagedResult;
  const idiomas = useMemo(
    () => (Array.isArray(idiomasPage.items) ? idiomasPage.items : []),
    [idiomasPage.items]
  );
  const loading = idiomasQuery.isLoading;
  const busy = idiomasQuery.isFetching;
  const error = idiomasQuery.isError ? idiomasQuery.error?.message || t("idiomaListLoadError") : "";

  const goTo = (route, idioma) => {
    navigate(`${route}/${encodeURIComponent(idioma.idIdioma)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("idiomaListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("idiomaListCount", { count: idiomasPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/idioma/agregar")}
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
          placeholder={t("searchIdiomas")}
          aria-label={t("searchIdiomas")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={idiomasPage.page}
          pageSize={idiomasPage.pageSize}
          totalCount={idiomasPage.totalCount}
          totalPages={idiomasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingIdiomas")} />
          </div>
        ) : idiomas.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("idiomaListTitle")}>
            {idiomas.map((idioma) => (
              <article
                key={idioma.idIdioma || idioma.idioma}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("idiomaCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {idioma.idioma}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("idiomaDescription")}</Text>
                      <Text className={styles.userName}>{idioma.descripcion}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/idioma/visualizar", idioma)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/idioma/editar", idioma)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/idioma/eliminar", idioma)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/idioma/log", idioma)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noIdiomasFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default IdiomaListPage;
