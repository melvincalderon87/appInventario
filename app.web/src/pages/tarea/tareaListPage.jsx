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
import { TareaService } from "../../services/tareaService";
import { getTareaThemeStyles, useTareaStyles } from "../../styles/pages/tarea/tareaPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function TareaListPage() {
  const styles = useTareaStyles();
  const themeStyles = getTareaThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codTarea:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const tareasQuery = useQuery({
    queryKey: ["tareas-listado", page, pageSize, search, sort],
    queryFn: () => TareaService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const tareasPage = tareasQuery.data ?? emptyPagedResult;
  const tareas = useMemo(
    () => (Array.isArray(tareasPage.items) ? tareasPage.items : []),
    [tareasPage.items]
  );
  const loading = tareasQuery.isLoading;
  const busy = tareasQuery.isFetching;
  const error = tareasQuery.isError ? tareasQuery.error?.message || t("taskListLoadError") : "";

  const goTo = (route, tarea) => {
    navigate(`${route}/${encodeURIComponent(tarea.codTarea)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("taskListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("taskListCount", {
              count: tareasPage.totalCount,
            })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/tarea/agregar")}
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
          placeholder={t("searchTasks")}
          aria-label={t("searchTasks")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={tareasPage.page}
          pageSize={tareasPage.pageSize}
          totalCount={tareasPage.totalCount}
          totalPages={tareasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingTasks")} />
          </div>
        ) : tareas.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("taskListTitle")}>
            {tareas.map((tarea) => (
              <article
                key={tarea.idTarea || tarea.codTarea}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("taskCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {tarea.codTarea}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("taskDescription")}</Text>
                      <Text className={styles.userName}>{tarea.descripcion}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("taskTime")}</Text>
                      <Text className={styles.metaValue}>{tarea.tiempo || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("taskNotificationsCount")}</Text>
                      <Text className={styles.metaValue}>{tarea.notificacionCantidad}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/tarea/visualizar", tarea)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/tarea/editar", tarea)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/tarea/eliminar", tarea)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/tarea/log", tarea)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noTasksFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default TareaListPage;
