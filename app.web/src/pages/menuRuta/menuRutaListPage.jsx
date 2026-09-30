import { useCallback, useEffect, useMemo, useState } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { MenuRutaService } from "../../services/menuRutaService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import { DEFAULT_PAGE_SIZE, emptyPagedResult, getTanStackSortParam } from "../../utils/pagination";

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function compareText(a, b) {
  return normalizeText(a).localeCompare(normalizeText(b), undefined, {
    numeric: true,
  });
}

function compareBoolean(a, b) {
  return Number(Boolean(a)) - Number(Boolean(b));
}

function textSorting(rowA, rowB, columnId) {
  return compareText(rowA.getValue(columnId), rowB.getValue(columnId));
}

function booleanSorting(rowA, rowB, columnId) {
  return compareBoolean(rowA.getValue(columnId), rowB.getValue(columnId));
}

function MenuRutaListPage() {
  const styles = useMenuStyles();
  const themeStyles = getMenuThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();

  const [search, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeValue] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState([]);
  const sort = getTanStackSortParam(sorting, "codMenu:asc");
  const statusText = useCallback((active) => (active ? t("active") : t("inactive")), [t]);

  const setSearch = (value) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const setPageSize = (value) => {
    const parsedSize = Number(value);
    setPageSizeValue(
      Number.isFinite(parsedSize) && parsedSize > 0 ? Math.min(parsedSize, 100) : DEFAULT_PAGE_SIZE
    );
    setCurrentPage(1);
  };

  const setPage = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setCurrentPage(nextPage);
    }
  };

  const goTo = useCallback(
    (route, ruta) => {
      navigate(`${route}/${encodeURIComponent(ruta.ruta)}`);
    },
    [navigate]
  );

  const ActionCell = useCallback(
    (ruta) => (
      <div className={styles.actionCell}>
        <div className={styles.tableActions}>
          {tienePermiso("visualizar") ? (
            <ListActionButton
              action="visualizar"
              label={t("view")}
              onClick={() => goTo("/menuruta/visualizar", ruta)}
            />
          ) : null}
          {tienePermiso("editar") ? (
            <ListActionButton
              action="editar"
              label={t("edit")}
              onClick={() => goTo("/menuruta/editar", ruta)}
            />
          ) : null}
          {tienePermiso("eliminar") ? (
            <ListActionButton
              action="eliminar"
              label={t("delete")}
              onClick={() => goTo("/menuruta/eliminar", ruta)}
            />
          ) : null}
          {tienePermiso("log") ? (
            <ListActionButton
              action="log"
              label={t("log")}
              onClick={() => goTo("/menuruta/log", ruta)}
            />
          ) : null}
        </div>
      </div>
    ),
    [goTo, styles.actionCell, styles.tableActions, t, tienePermiso]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "codMenu",
        header: t("menuCodeShort"),
        size: 88,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellNoWrap}>{getValue()}</span>,
      },
      {
        accessorKey: "menuDescripcion",
        header: t("menuDescriptionShort"),
        size: 220,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellExpanded}>{getValue()}</span>,
      },
      {
        accessorKey: "codTipoPermiso",
        header: t("permissionTypeCode"),
        size: 148,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellNoWrap}>{getValue()}</span>,
      },
      {
        accessorKey: "tipoPermisoDescripcion",
        header: t("permissionType"),
        size: 175,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellExpanded}>{getValue()}</span>,
      },
      {
        accessorKey: "ruta",
        header: t("menuRoutePath"),
        size: 220,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellExpanded}>{getValue()}</span>,
      },
      {
        accessorKey: "estatus",
        header: t("menuStatus"),
        size: 94,
        sortingFn: booleanSorting,
        cell: ({ getValue }) => statusText(getValue()),
      },
      {
        id: "acciones",
        header: t("actions"),
        size: 230,
        enableSorting: false,
        cell: ({ row }) => ActionCell(row.original),
      },
    ],
    [ActionCell, statusText, styles.tableCellExpanded, styles.tableCellNoWrap, t]
  );

  const rutasQuery = useQuery({
    queryKey: ["menu-rutas-listado", currentPage, pageSize, search, sort],
    queryFn: () =>
      MenuRutaService.listado({
        page: currentPage,
        pageSize,
        search,
        sort,
      }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const rutasPage = rutasQuery.data ?? emptyPagedResult;
  const rutas = useMemo(
    () => (Array.isArray(rutasPage.items) ? rutasPage.items : []),
    [rutasPage.items]
  );
  const loading = rutasQuery.isLoading;
  const busy = rutasQuery.isFetching;
  const error = rutasQuery.isError ? rutasQuery.error?.message || t("menuRouteListLoadError") : "";
  const totalItems = rutasPage.totalCount;
  const totalPages = rutasPage.totalPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

   
  const table = useReactTable({
    data: rutas,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    onSortingChange: (updater) => {
      setSorting((current) => (typeof updater === "function" ? updater(current) : updater));
      setCurrentPage(1);
    },
    getRowId: (row) => row.ruta,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const rutasRows = table.getRowModel().rows;

  const getColumnClassName = (columnId) => {
    const columnClasses = {
      codMenu: styles.menuCodeCell,
      menuDescripcion: styles.menuDescriptionCell,
      codTipoPermiso: styles.menuCodeCell,
      ruta: styles.menuLinkCell,
      acciones: styles.menuActionsCell,
    };

    return columnClasses[columnId] ?? "";
  };

  const getSortIndicator = (column) => {
    const sortState = column.getIsSorted();
    if (sortState === "asc") return "^";
    if (sortState === "desc") return "v";
    return "";
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("menuRouteListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("menuRouteListCount", { count: rutasPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/menuruta/agregar")}
          />
        ) : null}
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.searchBar} style={themeStyles.surface}>
        <Input
          className={styles.searchInput}
          value={search}
          onChange={(_, data) => {
            setSearch(data.value);
          }}
          contentBefore={<Search />}
          placeholder={t("searchMenuRoutes")}
          aria-label={t("searchMenuRoutes")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={currentPage}
          pageSize={pageSize}
          totalCount={rutasPage.totalCount}
          totalPages={rutasPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingMenuRoutes")} />
          </div>
        ) : totalItems > 0 ? (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            <div className={styles.menuTableScroll}>
              <table className={styles.menuTable} aria-label={t("menuRouteListTitle")}>
                <colgroup>
                  {table.getAllLeafColumns().map((column) => (
                    <col key={column.id} style={{ width: `${column.columnDef.size}px` }} />
                  ))}
                </colgroup>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`${styles.menuHeaderCell} ${getColumnClassName(header.column.id)}`}
                        >
                          {header.isPlaceholder ? null : (
                            <button
                              type="button"
                              className={styles.menuSortButton}
                              onClick={header.column.getToggleSortingHandler()}
                              disabled={!header.column.getCanSort()}
                            >
                              <span className={styles.tableHeaderLabel}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                              {header.column.getCanSort() ? (
                                <span className={styles.sortIndicator}>
                                  {getSortIndicator(header.column)}
                                </span>
                              ) : null}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rutasRows.map((row) => (
                    <tr key={row.id} className={styles.menuRow}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`${styles.menuCell} ${getColumnClassName(cell.column.id)}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <Text className={styles.empty}>{t("noMenuRoutesFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default MenuRutaListPage;
