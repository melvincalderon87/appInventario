import { useMemo, useState } from "react";
import {
  Input,
  MessageBar,
  Tooltip,
  Spinner,
  Button,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { Search } from "lucide-react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { ListActionButton } from "../../components/common/ListActionButton";
import { Switch } from "../../components/ui/switch";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import {
  getRolPermisoThemeStyles,
  useRolPermisoStyles,
} from "../../styles/pages/permiso/rolPermisoPageStyles";
import { PermisoService } from "../../services/permisoService";
import {
  DEFAULT_PAGE_SIZE,
  emptyPagedResult,
  normalizePage,
  normalizePageSize,
} from "../../utils/pagination";

function getRowKey(codMenu, codTipoPermiso) {
  return `${Number(codMenu) || 0}-${Number(codTipoPermiso) || 0}`;
}

function toInt(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizePermissionName(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const PERMISSION_TYPE_ORDER = [
  "listar",
  "agregar",
  "editar",
  "eliminar",
  "visualizar",
  "imprimir",
  "reporte",
  "exportar",
  "aprobar",
  "log",
  "otro menu",
];

function getPermissionTypeOrder(permissionType) {
  const description = normalizePermissionName(permissionType.descripcion);
  const index = PERMISSION_TYPE_ORDER.findIndex((name) => description === name);
  return index >= 0 ? index : PERMISSION_TYPE_ORDER.length;
}

function PermisoListPage() {
  const styles = useRolPermisoStyles();
  const themeStyles = getRolPermisoThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idRol = "" } = useParams();
  const queryClient = useQueryClient();
  const { tienePermiso } = usePermisosPantalla();
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const sort = "codMenu:asc";

  const permisosQueryRoot = useMemo(() => ["permisos-rol", idRol], [idRol]);
  const permisosQueryKey = useMemo(
    () => ["permisos-rol", idRol, page, pageSize, search, sort],
    [idRol, page, pageSize, search, sort]
  );
  const canAdd = tienePermiso("agregar");
  const canDelete = tienePermiso("eliminar");
  const canViewLog = tienePermiso("log");
  const pendingChangesCount = pendingChanges.size;

  const permisosQuery = useQuery({
    queryKey: permisosQueryKey,
    queryFn: async () => {
      const data = await PermisoService.listarPorRol(idRol, {
        page,
        pageSize,
        search,
        sort,
      });
      return data ?? emptyPagedResult;
    },
    enabled: Boolean(idRol),
    placeholderData: keepPreviousData,
  });

  const permisosPage = permisosQuery.data ?? emptyPagedResult;
  const permisos = useMemo(
    () => (Array.isArray(permisosPage.items) ? permisosPage.items : []),
    [permisosPage.items]
  );
  const error =
    saveError ||
    (permisosQuery.isError ? permisosQuery.error?.message || t("rolePermissionLoadError") : "");

  const saveMutation = useMutation({
    mutationFn: async (changes) => {
      await PermisoService.actualizarCambios(changes);
    },
    onMutate: () => {
      setSaveError("");
      setMessage("");
    },
    onSuccess: (_, changes) => {
      setPendingChanges(new Map());
      setMessage(t("rolePermissionChangesSaved", { count: changes.length }));
      queryClient.invalidateQueries({ queryKey: permisosQueryRoot });
    },
    onError: (saveError) => {
      setSaveError(saveError.message || t("rolePermissionSaveError"));
    },
  });

  const rolInfo = useMemo(() => {
    const primero = permisos[0];

    if (!primero) return null;

    return {
      codRol: primero.codRol,
      descripcion: primero.rolDescripcion,
    };
  }, [permisos]);

  const permissionTypes = useMemo(() => {
    const map = new Map();

    permisos.forEach((permiso) => {
      const codTipoPermiso = toInt(permiso.codTipoPermiso);

      if (codTipoPermiso <= 0) {
        return;
      }

      if (!map.has(codTipoPermiso)) {
        map.set(codTipoPermiso, {
          codTipoPermiso,
          descripcion: permiso.tipoPermisoDescripcion || "",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const orderDiff = getPermissionTypeOrder(a) - getPermissionTypeOrder(b);
      return orderDiff || a.codTipoPermiso - b.codTipoPermiso;
    });
  }, [permisos]);

  const permisoIndex = useMemo(() => {
    const map = new Map();

    permisos.forEach((permiso) => {
      const codMenu = toInt(permiso.codMenu);
      const codTipoPermiso = toInt(permiso.codTipoPermiso);

      if (codMenu <= 0 || codTipoPermiso <= 0) {
        return;
      }

      map.set(getRowKey(codMenu, codTipoPermiso), permiso);
    });

    return map;
  }, [permisos]);

  const rowsByMenu = useMemo(() => {
    const map = new Map();

    permisos.forEach((permiso) => {
      const codMenu = toInt(permiso.codMenu);
      if (codMenu <= 0) {
        return;
      }

      if (!map.has(codMenu)) {
        map.set(codMenu, {
          codRol: toInt(permiso.codRol),
          idRol: permiso.idRol ?? "",
          rolDescripcion: permiso.rolDescripcion || "",
          codMenu,
          idMenu: permiso.idMenu ?? "",
          menuDescripcion: permiso.menuDescripcion || "",
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.codMenu - b.codMenu);
  }, [permisos]);

  const visibleRows = rowsByMenu;

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageChange = (value) => {
    setPage(normalizePage(value));
  };

  const handlePageSizeChange = (value) => {
    setPageSize(normalizePageSize(value));
    setPage(1);
  };

  const togglePermiso = (row, tipoPermiso, checked, originalChecked) => {
    const rowKey = getRowKey(row.codMenu, tipoPermiso.codTipoPermiso);

    if (checked !== originalChecked && ((checked && !canAdd) || (!checked && !canDelete))) {
      return;
    }

    setSaveError("");
    setMessage("");
    setPendingChanges((current) => {
      const next = new Map(current);

      if (checked === originalChecked) {
        next.delete(rowKey);
        return next;
      }

      next.set(rowKey, {
        codRol: row.codRol,
        codMenu: row.codMenu,
        codTipoPermiso: tipoPermiso.codTipoPermiso,
        asignado: checked,
      });

      return next;
    });
  };

  const savePendingChanges = () => {
    const changes = Array.from(pendingChanges.values());

    if (changes.length === 0) {
      setSaveError("");
      setMessage(t("rolePermissionNoChanges"));
      return;
    }

    saveMutation.mutate(changes);
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("rolePermissionTitle")}</Title2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {rolInfo ? (
            <Button size="small" appearance="outline" disabled>
              {t("rolePermissionHeader", {
                roleCode: rolInfo.codRol,
                role: rolInfo.descripcion,
              })}
            </Button>
          ) : null}
          <ListActionButton
            action="agregarPermiso"
            label={t("rolePermissionSaveChanges")}
            text={
              saveMutation.isPending
                ? t("saving")
                : t("rolePermissionSaveChangesWithCount", { count: pendingChangesCount })
            }
            disabled={saveMutation.isPending || pendingChangesCount === 0}
            onClick={savePendingChanges}
          />
          <ListActionButton
            action="regresar"
            label={t("back")}
            text={t("back")}
            onClick={() => navigate("/rol/listar")}
          />
        </div>
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {permisosQuery.isLoading ? (
          <div className={styles.loading}>
            <Spinner label={t("rolePermissionLoading")} />
          </div>
        ) : (
          <>
            <div className={styles.searchBar} style={themeStyles.surface}>
              <Input
                value={search}
                onChange={(_, data) => handleSearchChange(data.value)}
                contentBefore={<Search />}
                placeholder={t("searchRolePermissions")}
                aria-label={t("searchRolePermissions")}
                className={styles.searchInput}
              />
            </div>

            <PaginationToolbar
              page={permisosPage.page}
              pageSize={permisosPage.pageSize}
              totalCount={permisosPage.totalCount}
              totalPages={permisosPage.totalPages}
              loading={permisosQuery.isFetching}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />

            <div className={styles.permissionTableWrap}>
              <table
                aria-label={t("rolePermissionTitle")}
                className={styles.permissionTableCompact}
              >
                <colgroup>
                  <col className={styles.permissionCodeColumn} />
                  <col className={styles.permissionMenuColumn} />
                  {permissionTypes.map((tipo) => (
                    <col key={tipo.codTipoPermiso} className={styles.permissionTypeColumn} />
                  ))}
                  <col className={styles.permissionActionColumn} />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      className={`${styles.permissionHeaderCell} ${styles.permissionMenuCodeHeader}`}
                    >
                      {t("menuCodeShort")}
                    </th>
                    <th className={`${styles.permissionHeaderCell} ${styles.permissionMenuHeader}`}>
                      {t("menu", { defaultValue: "Menu" })}
                    </th>
                    {permissionTypes.map((tipo) => (
                      <th
                        key={tipo.codTipoPermiso}
                        className={`${styles.permissionHeaderCell} ${styles.permissionTypeHeader}`}
                      >
                        <Tooltip
                          content={tipo.descripcion || t("permissionType")}
                          relationship="description"
                        >
                          <Text
                            className={styles.permissionHeaderGrow}
                            title={tipo.descripcion || t("permissionType")}
                          >
                            {tipo.descripcion || t("permissionType")}
                          </Text>
                        </Tooltip>
                      </th>
                    ))}
                    <th className={`${styles.permissionHeaderCell} ${styles.permissionLogHeader}`}>
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length > 0 ? (
                    visibleRows.map((row) => (
                      <tr key={row.codMenu} className={styles.permissionRow}>
                        <td className={`${styles.permissionCell} ${styles.permissionMenuCodeCell}`}>
                          {row.codMenu}
                        </td>
                        <td className={`${styles.permissionCell} ${styles.permissionMenuCell}`}>
                          {row.menuDescripcion}
                        </td>
                        {permissionTypes.map((tipo) => {
                          const innerRow = permisoIndex.get(
                            getRowKey(row.codMenu, tipo.codTipoPermiso)
                          );
                          const rowPermissionKey = getRowKey(row.codMenu, tipo.codTipoPermiso);
                          const originalChecked = Boolean(innerRow?.asignado);
                          const pendingChange = pendingChanges.get(rowPermissionKey);
                          const checked = pendingChange
                            ? Boolean(pendingChange.asignado)
                            : originalChecked;
                          const canChangePermission =
                            checked === originalChecked ? (checked ? canDelete : canAdd) : true;

                          return (
                            <td
                              key={tipo.codTipoPermiso}
                              className={`${styles.permissionCell} ${styles.permissionTypeCell}`}
                            >
                              <Switch
                                checked={checked}
                                disabled={!canChangePermission || saveMutation.isPending}
                                aria-label={`${tipo.descripcion || t("permissionType")} - ${row.menuDescripcion}`}
                                onCheckedChange={(nextChecked) =>
                                  togglePermiso(row, tipo, nextChecked, originalChecked)
                                }
                              />
                            </td>
                          );
                        })}
                        <td className={`${styles.permissionCell} ${styles.permissionLogCell}`}>
                          {canViewLog ? (
                            <ListActionButton
                              action="log"
                              label={t("log")}
                              onClick={() =>
                                navigate(
                                  `/permiso/log/${encodeURIComponent(row.idRol)}/${encodeURIComponent(row.idMenu)}`
                                )
                              }
                            />
                          ) : null}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={styles.permissionCell} colSpan={3 + permissionTypes.length}>
                        <Text className={styles.empty}>{t("noRolePermissionsFound")}</Text>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default PermisoListPage;
