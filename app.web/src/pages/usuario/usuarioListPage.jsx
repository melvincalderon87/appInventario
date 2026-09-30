import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Input,
  MessageBar,
  Spinner,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { Search, Table2 } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { UsuarioService } from "../../services/usuarioService";
import {
  getUsuarioThemeStyles,
  useUsuarioStyles,
} from "../../styles/pages/usuario/usuarioPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function escapeExcelValue(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildExportFileName() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return [
    "usuarios",
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    `${pad(now.getHours())}${pad(now.getMinutes())}`,
  ].join("_");
}

function UsuarioListPage() {
  const styles = useUsuarioStyles();
  const themeStyles = getUsuarioThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const pagination = useServerPagination("codUsuario:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch } = pagination;
  const returnToUsuarioListado = "/usuario/listar";
  const returnToParametro = encodeURIComponent(returnToUsuarioListado);
  const usuariosQuery = useQuery({
    queryKey: ["usuarios-listado", page, pageSize, search, sort],
    queryFn: () => UsuarioService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const usuariosPage = usuariosQuery.data ?? emptyPagedResult;
  const usuarios = useMemo(
    () => (Array.isArray(usuariosPage.items) ? usuariosPage.items : []),
    [usuariosPage.items]
  );
  const loading = usuariosQuery.isLoading;
  const busy = usuariosQuery.isFetching;
  const error =
    exportError ||
    (usuariosQuery.isError ? usuariosQuery.error?.message || t("userListLoadError") : "");

  const goTo = (route, usuario) => {
    navigate(`${route}/${encodeURIComponent(usuario.idUsuario)}`);
  };

  const exportToExcel = async () => {
    setExportError("");
    setExporting(true);

    try {
      const rows = await UsuarioService.exportar({ search, sort });

      if (rows.length === 0) {
        setExportError(t("userExportNoData"));
        return;
      }

      const columns = [
        { header: t("userCode"), render: (row) => row.codUsuario },
        { header: t("userName"), render: (row) => row.nombre },
        { header: t("email"), render: (row) => row.correo },
        { header: t("status"), render: (row) => (row.estatus ? t("active") : t("inactive")) },
        { header: t("userConfigurationTypeUser"), render: (row) => row.tipoUsuario },
        { header: t("userConfigurationRole"), render: (row) => row.rol },
        { header: t("userPreferenceLanguage"), render: (row) => row.idioma },
        { header: t("userPreferenceTheme"), render: (row) => row.theme },
      ];
      const tableRows = [
        columns.map((column) => column.header),
        ...rows.map((row) => columns.map((column) => column.render(row))),
      ]
        .map(
          (row) => `<tr>${row.map((cell) => `<td>${escapeExcelValue(cell)}</td>`).join("")}</tr>`
        )
        .join("");
      const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`;
      const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${buildExportFileName()}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (exportRequestError) {
      setExportError(exportRequestError.message || t("userExportError"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("userListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("userListCount", { count: usuariosPage.totalCount })}
          </Text>
        </div>
        <div className={styles.headerActions}>
          {tienePermiso("agregar") ? (
            <ListActionButton
              action="agregar"
              label={t("add")}
              text={t("add")}
              onClick={() => navigate("/usuario/agregar")}
            />
          ) : null}
          {tienePermiso("exportar") ? (
            <Button
              appearance="primary"
              icon={<Table2 />}
              onClick={exportToExcel}
              disabled={exporting || busy || usuariosPage.totalCount === 0}
            >
              {t("exportExcel")}
            </Button>
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
          placeholder={t("searchUsers")}
          aria-label={t("searchUsers")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={usuariosPage.page}
          pageSize={usuariosPage.pageSize}
          totalCount={usuariosPage.totalCount}
          totalPages={usuariosPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingUsers")} />
          </div>
        ) : usuarios.length > 0 ? (
          <div className={styles.cardGrid} aria-label={t("userListTitle")}>
            {usuarios.map((usuario) => (
              <article
                key={usuario.idUsuario || usuario.codUsuario}
                className={styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("userCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {usuario.codUsuario}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("userName")}</Text>
                      <Text className={styles.userName}>{usuario.nombre}</Text>
                    </div>
                  </div>
                  <div className={styles.statusField}>
                    <Text className={styles.metaLabel}>{t("status")}</Text>
                    <Badge appearance="tint" color={usuario.estatus ? "success" : "danger"}>
                      {usuario.estatus ? t("active") : t("inactive")}
                    </Badge>
                  </div>
                </div>

                <div className={styles.cardField}>
                  <Text className={styles.metaLabel}>{t("email")}</Text>
                  <Text className={styles.metaValue}>{usuario.correo}</Text>
                </div>

                <div className={styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/usuario/visualizar", usuario)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <>
                      <ListActionButton
                        action="editar"
                        label={t("edit")}
                        onClick={() => goTo("/usuario/editar", usuario)}
                      />
                      <ListActionButton
                        action="cambiarPassword"
                        label={t("changePassword")}
                        onClick={() => goTo("/usuario/cambiarpassword", usuario)}
                      />
                    </>
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/usuario/eliminar", usuario)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/usuario/log", usuario)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="configuracion"
                      label={t("configure")}
                      onClick={() =>
                        navigate(
                          `/usuarioconfiguracion/listar/${encodeURIComponent(usuario.idUsuario)}?returnTo=${returnToParametro}`
                        )
                      }
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="preferencia"
                      label={t("userPreferenceTitle")}
                      onClick={() =>
                        navigate(
                          `/usuariopreferencia/listar/${encodeURIComponent(usuario.idUsuario)}?returnTo=${returnToParametro}`
                        )
                      }
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="configuracion"
                      label={t("userSupplierTitle")}
                      onClick={() =>
                        navigate(
                          `/usuariosuplidor/listar/${encodeURIComponent(usuario.idUsuario)}?returnTo=${returnToParametro}`
                        )
                      }
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noUsersFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default UsuarioListPage;
