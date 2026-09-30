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
import { ConfiguracionCorreoService } from "../../services/configuracionCorreoService";
import {
  getConfiguracionCorreoThemeStyles,
  useConfiguracionCorreoStyles,
} from "../../styles/pages/configuracionCorreo/configuracionCorreoPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function ConfiguracionCorreoListPage() {
  const styles = useConfiguracionCorreoStyles();
  const themeStyles = getConfiguracionCorreoThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codConfiguracionCorreo:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const configuracionesCorreoQuery = useQuery({
    queryKey: ["configuraciones-correo-listado", page, pageSize, search, sort],
    queryFn: () => ConfiguracionCorreoService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const configuracionUnicaQuery = useQuery({
    queryKey: ["configuraciones-correo-unica"],
    queryFn: () =>
      ConfiguracionCorreoService.listado({
        page: 1,
        pageSize: 1,
        search: "",
        sort: "codConfiguracionCorreo:asc",
      }),
    staleTime: 0,
  });
  const configuracionesCorreoPage = configuracionesCorreoQuery.data ?? emptyPagedResult;
  const configuracionesCorreo = useMemo(
    () => (Array.isArray(configuracionesCorreoPage.items) ? configuracionesCorreoPage.items : []),
    [configuracionesCorreoPage.items]
  );
  const existeConfiguracionCorreo =
    (configuracionUnicaQuery.data?.totalCount ?? configuracionesCorreoPage.totalCount) > 0;
  const puedeAgregarConfiguracion =
    tienePermiso("agregar") && !configuracionUnicaQuery.isLoading && !existeConfiguracionCorreo;
  const loading = configuracionesCorreoQuery.isLoading;
  const busy = configuracionesCorreoQuery.isFetching;
  const error = configuracionesCorreoQuery.isError
    ? configuracionesCorreoQuery.error?.message || t("emailConfigurationListLoadError")
    : "";

  const goTo = (route, configuracionCorreo) => {
    navigate(`${route}/${encodeURIComponent(configuracionCorreo.idConfiguracionCorreo)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("emailConfigurationListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("emailConfigurationListCount", {
              count: configuracionesCorreoPage.totalCount,
            })}
          </Text>
        </div>
        {puedeAgregarConfiguracion ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/configuracioncorreo/agregar")}
          />
        ) : null}
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {existeConfiguracionCorreo ? (
        <MessageBar intent="info">{t("emailConfigurationSingleLimitMessage")}</MessageBar>
      ) : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => setSearch(data.value)}
          contentBefore={<Search />}
          placeholder={t("searchEmailConfigurations")}
          aria-label={t("searchEmailConfigurations")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={configuracionesCorreoPage.page}
          pageSize={configuracionesCorreoPage.pageSize}
          totalCount={configuracionesCorreoPage.totalCount}
          totalPages={configuracionesCorreoPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingEmailConfigurations")} />
          </div>
        ) : configuracionesCorreo.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("emailConfigurationListTitle")}>
            {configuracionesCorreo.map((configuracionCorreo) => (
              <article
                key={
                  configuracionCorreo.idConfiguracionCorreo ||
                  configuracionCorreo.codConfiguracionCorreo
                }
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("emailConfigurationCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {configuracionCorreo.codConfiguracionCorreo}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("emailConfigurationDescription")}</Text>
                      <Text className={styles.userName}>{configuracionCorreo.descripcion}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("emailConfigurationEmailAddress")}
                      </Text>
                      <Text className={styles.userName}>{configuracionCorreo.direccionCorreo}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("emailConfigurationOutgoingServer")}
                      </Text>
                      <Text className={styles.metaValue}>{configuracionCorreo.servidorSalida}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("emailConfigurationAuthProvider")}
                      </Text>
                      <Text className={styles.metaValue}>
                        {t(
                          `emailConfigurationProvider${
                            configuracionCorreo.proveedorAutenticacion === "Personalizado"
                              ? "SMTP"
                              : configuracionCorreo.proveedorAutenticacion || "SMTP"
                          }`
                        )}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("emailConfigurationAuthStatus")}</Text>
                      <Text className={styles.metaValue}>
                        {configuracionCorreo.estatusAutenticacion ||
                          t("emailConfigurationAuthStatusPending")}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>
                        {t("emailConfigurationOutgoingPort")}
                      </Text>
                      <Text className={styles.metaValue}>{configuracionCorreo.puertoSalida}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("emailConfigurationStatus")}</Text>
                      <Text className={styles.metaValue}>
                        {configuracionCorreo.estatus ? t("active") : t("inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/configuracioncorreo/visualizar", configuracionCorreo)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/configuracioncorreo/editar", configuracionCorreo)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/configuracioncorreo/eliminar", configuracionCorreo)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/configuracioncorreo/log", configuracionCorreo)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noEmailConfigurationsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default ConfiguracionCorreoListPage;
