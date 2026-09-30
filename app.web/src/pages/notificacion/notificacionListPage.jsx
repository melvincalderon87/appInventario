import { useMemo, useState } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { NotificacionService } from "../../services/notificacionService";
import {
  getNotificacionThemeStyles,
  useNotificacionStyles,
} from "../../styles/pages/notificacion/notificacionPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function estadoClassName(estado) {
  return `notification-status-${Number(estado) || 0}`;
}

function NotificacionListPage() {
  const styles = useNotificacionStyles();
  const themeStyles = getNotificacionThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tienePermiso } = usePermisosPantalla();
  const queryClient = useQueryClient();
  const pagination = useServerPagination("codNotificacion:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const codTarea = Number(searchParams.get("codTarea")) || 0;
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const notificacionesQuery = useQuery({
    queryKey: ["notificaciones-listado", page, pageSize, search, sort, codTarea],
    queryFn: () => NotificacionService.listado({ ...params, codTarea }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const notificacionesPage = notificacionesQuery.data ?? emptyPagedResult;
  const notificaciones = useMemo(
    () => (Array.isArray(notificacionesPage.items) ? notificacionesPage.items : []),
    [notificacionesPage.items]
  );
  const loading = notificacionesQuery.isLoading;
  const busy = notificacionesQuery.isFetching;
  const error = notificacionesQuery.isError
    ? notificacionesQuery.error?.message || t("notificationListLoadError")
    : "";

  const refreshList = () => queryClient.invalidateQueries({ queryKey: ["notificaciones-listado"] });
  const actionMutation = useMutation({
    mutationFn: async ({ action, notificacion }) => {
      if (action === "programar") {
        return NotificacionService.programar(
          notificacion.codNotificacion,
          notificacion.fechaProgramada
        );
      }

      if (action === "enviar") {
        return NotificacionService.enviarAhora(notificacion.codNotificacion);
      }

      if (action === "reintentar") {
        return NotificacionService.reintentar(notificacion.codNotificacion);
      }

      return NotificacionService.cancelar(notificacion.codNotificacion);
    },
    onSuccess: (_, variables) => {
      setActionError("");
      setActionMessage(t(`notificationAction${variables.action}`));
      refreshList();
    },
    onError: (mutationError) => {
      setActionMessage("");
      setActionError(mutationError.message || t("notificationActionError"));
    },
  });

  const goTo = (route, notificacion) => {
    navigate(`${route}/${encodeURIComponent(notificacion.codNotificacion)}`);
  };

  const runAction = (action, notificacion) => {
    actionMutation.mutate({ action, notificacion });
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("notificationListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("notificationListCount", {
              count: notificacionesPage.totalCount,
            })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/notificacion/agregar")}
          />
        ) : null}
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {actionError ? <MessageBar intent="error">{actionError}</MessageBar> : null}
      {actionMessage ? <MessageBar intent="success">{actionMessage}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchNotifications")}
          aria-label={t("searchNotifications")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={notificacionesPage.page}
          pageSize={notificacionesPage.pageSize}
          totalCount={notificacionesPage.totalCount}
          totalPages={notificacionesPage.totalPages}
          loading={busy || actionMutation.isPending}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingNotifications")} />
          </div>
        ) : notificaciones.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("notificationListTitle")}>
            {notificaciones.map((notificacion) => (
              <article
                key={notificacion.idNotificacion || notificacion.codNotificacion}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("notificationCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {notificacion.codNotificacion}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("notificationDescription")}</Text>
                      <Text className={styles.userName}>{notificacion.descripcion}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("notificationTask")}</Text>
                      <Text className={styles.metaValue}>
                        {notificacion.tareaDescripcion || "-"}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("notificationSubject")}</Text>
                      <Text className={styles.metaValue}>{notificacion.asunto || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("notificationState")}</Text>
                      <Text
                        className={`${styles.metaValue} ${estadoClassName(notificacion.estado)}`}
                      >
                        {notificacion.estadoDescripcion}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("notificationAttempts")}</Text>
                      <Text className={styles.metaValue}>{notificacion.intentos}</Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/notificacion/visualizar", notificacion)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/notificacion/editar", notificacion)}
                    />
                  ) : null}
                  {tienePermiso("otro") ? (
                    <>
                      <ListActionButton
                        action="programar"
                        label={t("notificationSchedule")}
                        disabled={actionMutation.isPending}
                        onClick={() => runAction("programar", notificacion)}
                      />
                      <ListActionButton
                        action="enviar"
                        label={t("notificationSendNow")}
                        disabled={actionMutation.isPending}
                        onClick={() => runAction("enviar", notificacion)}
                      />
                      <ListActionButton
                        action="reintentar"
                        label={t("notificationRetry")}
                        disabled={actionMutation.isPending}
                        onClick={() => runAction("reintentar", notificacion)}
                      />
                      <ListActionButton
                        action="cancelar"
                        label={t("notificationCancel")}
                        disabled={actionMutation.isPending}
                        onClick={() => runAction("cancelar", notificacion)}
                      />
                    </>
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/notificacion/eliminar", notificacion)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noNotificationsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default NotificacionListPage;
