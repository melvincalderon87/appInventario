import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { StandardListTable } from "../../components/common/StandardListTable";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { RolService } from "../../services/rolService";
import { getRolThemeStyles, useRolStyles } from "../../styles/pages/rol/rolPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function RolListPage() {
  const styles = useRolStyles();
  const themeStyles = getRolThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codRol:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } = pagination;
  const rolesQuery = useQuery({
    queryKey: ["roles-listado", page, pageSize, search, sort],
    queryFn: () => RolService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const rolesPage = rolesQuery.data ?? emptyPagedResult;
  const roles = useMemo(
    () => (Array.isArray(rolesPage.items) ? rolesPage.items : []),
    [rolesPage.items]
  );
  const loading = rolesQuery.isLoading;
  const busy = rolesQuery.isFetching;
  const error = rolesQuery.isError ? rolesQuery.error?.message || t("roleListLoadError") : "";

  const goTo = (route, rol) => {
    navigate(`${route}/${encodeURIComponent(rol.idRol)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("roleListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("roleListCount", { count: rolesPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/rol/agregar")}
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
          placeholder={t("searchRoles")}
          aria-label={t("searchRoles")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={rolesPage.page}
          pageSize={rolesPage.pageSize}
          totalCount={rolesPage.totalCount}
          totalPages={rolesPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingRoles")} />
          </div>
        ) : (
          <StandardListTable
            ariaLabel={t("roleListTitle")}
            columns={[
              { key: "codigo", label: t("roleCode"), sortKey: "codRol", render: (rol) => rol.codRol },
              { key: "descripcion", label: t("roleDescription"), sortKey: "descripcion", render: (rol) => rol.descripcion },
            ]}
            rows={roles}
            getRowKey={(rol) => rol.idRol || rol.codRol}
            sort={sort}
            onSortChange={setSort}
            emptyMessage={t("noRolesFound")}
            styles={styles}
            surfaceStyle={themeStyles.surface}
            canExport={tienePermiso("exportar")}
            exportTitle={t("roleListTitle")}
            exportFileName="roles"
            renderActions={(rol) => <>
              {tienePermiso("visualizar") ? <ListActionButton action="visualizar" label={t("view")} onClick={() => goTo("/rol/visualizar", rol)} /> : null}
              {tienePermiso("editar") ? <ListActionButton action="editar" label={t("edit")} onClick={() => goTo("/rol/editar", rol)} /> : null}
              {tienePermiso("eliminar") ? <ListActionButton action="eliminar" label={t("delete")} onClick={() => goTo("/rol/eliminar", rol)} /> : null}
              {tienePermiso("log") ? <ListActionButton action="log" label={t("log")} onClick={() => goTo("/rol/log", rol)} /> : null}
              {tienePermiso("listar") ? <ListActionButton action="configuracion" label={t("permissions")} text={t("permissions")} onClick={() => goTo("/rol/permisos", rol)} /> : null}
            </>}
          />
        )}
      </div>
    </section>
  );
}

export default RolListPage;
