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
import { MenuService } from "../../services/menuService";
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

function compareNumber(a, b) {
  return Number(a ?? 0) - Number(b ?? 0);
}

function textSorting(rowA, rowB, columnId) {
  return compareText(rowA.getValue(columnId), rowB.getValue(columnId));
}

function numberSorting(rowA, rowB, columnId) {
  return compareNumber(rowA.getValue(columnId), rowB.getValue(columnId));
}

function MenuListPage() {
  const styles = useMenuStyles();
  const themeStyles = getMenuThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState([]);
  const sort = getTanStackSortParam(sorting, "padre:asc");

  const statusText = useCallback((active) => (active ? t("active") : t("inactive")), [t]);

  const goTo = useCallback(
    (route, menu) => {
      navigate(`${route}/${encodeURIComponent(menu.idMenu)}`);
    },
    [navigate]
  );

  const ActionCell = useCallback(
    (item) => (
      <div className={styles.actionCell}>
        <div className={styles.tableActions}>
          {tienePermiso("visualizar") ? (
            <ListActionButton
              action="visualizar"
              label={t("view")}
              onClick={() => goTo("/menu/visualizar", item)}
            />
          ) : null}
          {tienePermiso("editar") ? (
            <ListActionButton
              action="editar"
              label={t("edit")}
              onClick={() => goTo("/menu/editar", item)}
            />
          ) : null}
          {tienePermiso("eliminar") ? (
            <ListActionButton
              action="eliminar"
              label={t("delete")}
              onClick={() => goTo("/menu/eliminar", item)}
            />
          ) : null}
          {tienePermiso("log") ? (
            <ListActionButton
              action="log"
              label={t("log")}
              onClick={() => goTo("/menu/log", item)}
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
        size: 78,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellNoWrap}>{getValue()}</span>,
      },
      {
        accessorKey: "descripcion",
        header: t("menuDescriptionShort"),
        size: 210,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellExpanded}>{getValue()}</span>,
      },
      {
        accessorKey: "link",
        header: t("menuLink"),
        size: 190,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellExpanded}>{getValue()}</span>,
      },
      {
        accessorKey: "padre",
        header: t("menuParent"),
        size: 86,
        sortingFn: textSorting,
      },
      {
        accessorKey: "orden",
        header: t("menuOrder"),
        size: 78,
        sortingFn: numberSorting,
        cell: ({ getValue }) => String(getValue() ?? ""),
      },
      {
        accessorKey: "estatus",
        header: t("menuStatus"),
        size: 96,
        sortingFn: numberSorting,
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

  const menusQuery = useQuery({
    queryKey: ["menus-listado", currentPage, pageSize, search, sort],
    queryFn: () =>
      MenuService.listado({
        page: currentPage,
        pageSize,
        search,
        sort,
      }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const menusPage = menusQuery.data ?? emptyPagedResult;
  const menus = useMemo(
    () => (Array.isArray(menusPage.items) ? menusPage.items : []),
    [menusPage.items]
  );
  const loading = menusQuery.isLoading;
  const busy = menusQuery.isFetching;
  const error = menusQuery.isError ? menusQuery.error?.message || t("menuListLoadError") : "";

  const totalItems = menusPage.totalCount;
  const totalPages = menusPage.totalPages;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagination = useMemo(
    () => ({
      pageIndex: currentPage - 1,
      pageSize,
    }),
    [currentPage, pageSize]
  );

   
  const table = useReactTable({
    data: menus,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: (updater) => {
      setSorting((current) => (typeof updater === "function" ? updater(current) : updater));
      setCurrentPage(1);
    },
    getRowId: (row) => row.idMenu || `${row.codMenu}`,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const menuRows = table.getRowModel().rows;

  const goToPage = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setCurrentPage(nextPage);
    }
  };

  const onPageSizeChange = (value) => {
    const parsedSize = Number(value);
    setPageSize(
      Number.isFinite(parsedSize) && parsedSize > 0 ? Math.min(parsedSize, 100) : DEFAULT_PAGE_SIZE
    );
    setCurrentPage(1);
  };

  const getColumnClassName = (columnId) => {
    const columnClasses = {
      codMenu: styles.menuCodeCell,
      descripcion: styles.menuDescriptionCell,
      link: styles.menuLinkCell,
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
          <Title2 className={styles.title}>{t("menuListTitle")}</Title2>
          <Text className={styles.subtitle}>{t("menuListCount", { count: totalItems })}</Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/menu/agregar")}
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
            setCurrentPage(1);
          }}
          contentBefore={<Search />}
          placeholder={t("searchMenus")}
          aria-label={t("searchMenus")}
        />
      </div>

      <div className={styles.listSurface}>
        <PaginationToolbar
          page={currentPage}
          pageSize={pageSize}
          totalCount={totalItems}
          totalPages={totalPages}
          loading={busy}
          onPageChange={goToPage}
          onPageSizeChange={onPageSizeChange}
        />

        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingMenus")} />
          </div>
        ) : (
          <div className={styles.menuTableSurface} style={themeStyles.surface}>
            {menuRows.length > 0 ? (
              <div className={styles.menuTableScroll}>
                <table className={styles.menuTable} aria-label={t("menuListTitle")}>
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
                    {menuRows.map((row) => (
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
            ) : (
              <Text className={styles.empty}>{t("noMenusFound")}</Text>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default MenuListPage;
