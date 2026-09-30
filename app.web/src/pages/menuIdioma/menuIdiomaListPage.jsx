import { useCallback, useMemo, useState } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { MenuIdiomaService } from "../../services/menuIdiomaService";
import {
  getMenuIdiomaThemeStyles,
  useMenuIdiomaStyles,
} from "../../styles/pages/menuIdioma/menuIdiomaPageStyles";
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

function textSorting(rowA, rowB, columnId) {
  return compareText(rowA.getValue(columnId), rowB.getValue(columnId));
}

function MenuIdiomaListPage() {
  const styles = useMenuIdiomaStyles();
  const themeStyles = getMenuIdiomaThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState([]);
  const sort = getTanStackSortParam(sorting, "codMenu:asc");

  const goTo = useCallback(
    (route, menuIdioma) => {
      navigate(`${route}/${encodeURIComponent(menuIdioma.idMenuIdioma)}`);
    },
    [navigate]
  );

  const ActionCell = useCallback(
    (menuIdioma) => (
      <div className={styles.actionCell}>
        <div className={styles.tableActions}>
          {tienePermiso("visualizar") ? (
            <ListActionButton
              action="visualizar"
              label={t("view")}
              onClick={() => goTo("/menuidioma/visualizar", menuIdioma)}
            />
          ) : null}
          {tienePermiso("editar") ? (
            <ListActionButton
              action="editar"
              label={t("edit")}
              onClick={() => goTo("/menuidioma/editar", menuIdioma)}
            />
          ) : null}
          {tienePermiso("eliminar") ? (
            <ListActionButton
              action="eliminar"
              label={t("delete")}
              onClick={() => goTo("/menuidioma/eliminar", menuIdioma)}
            />
          ) : null}
          {tienePermiso("log") ? (
            <ListActionButton
              action="log"
              label={t("log")}
              onClick={() => goTo("/menuidioma/log", menuIdioma)}
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
        size: 96,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellNoWrap}>{getValue()}</span>,
      },
      {
        accessorKey: "idioma",
        header: t("language"),
        size: 120,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellNoWrap}>{getValue()}</span>,
      },
      {
        accessorKey: "descripcion",
        header: t("menuDescription"),
        size: 260,
        sortingFn: textSorting,
        cell: ({ getValue }) => <span className={styles.tableCellExpanded}>{getValue()}</span>,
      },
      {
        id: "acciones",
        header: t("actions"),
        size: 300,
        enableSorting: false,
        cell: ({ row }) => ActionCell(row.original),
      },
    ],
    [ActionCell, t, styles.tableCellExpanded, styles.tableCellNoWrap]
  );

  const menuIdiomasQuery = useQuery({
    queryKey: ["menu-idiomas-listado", currentPage, pageSize, search, sort],
    queryFn: () =>
      MenuIdiomaService.listado({
        page: currentPage,
        pageSize,
        search,
        sort,
      }),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const menuIdiomasPage = menuIdiomasQuery.data ?? emptyPagedResult;
  const menuIdiomas = useMemo(
    () => (Array.isArray(menuIdiomasPage.items) ? menuIdiomasPage.items : []),
    [menuIdiomasPage.items]
  );
  const loading = menuIdiomasQuery.isLoading;
  const busy = menuIdiomasQuery.isFetching;
  const error = menuIdiomasQuery.isError
    ? menuIdiomasQuery.error?.message || t("menuIdiomaListLoadError")
    : "";

   
  const table = useReactTable({
    data: menuIdiomas,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      setSorting((current) => (typeof updater === "function" ? updater(current) : updater));
      setCurrentPage(1);
    },
    getRowId: (row) => row.idMenuIdioma || `${row.codMenu}-${row.idioma || ""}`,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const menuRows = table.getRowModel().rows;
  const totalItems = menuIdiomasPage.totalCount;
  const totalPages = menuIdiomasPage.totalPages;

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
      codMenu: styles.menuIdiomaCodeCell,
      idioma: styles.menuIdiomaLanguageCell,
      descripcion: styles.menuIdiomaDescriptionCell,
      acciones: styles.menuIdiomaActionsCell,
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
          <Title2 className={styles.title}>{t("menuIdiomaListTitle")}</Title2>
          <Text className={styles.subtitle}>{t("menuIdiomaListCount", { count: totalItems })}</Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/menuidioma/agregar")}
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
          placeholder={t("searchMenuIdiomas")}
          aria-label={t("searchMenuIdiomas")}
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
            <Spinner label={t("loadingMenuIdiomas")} />
          </div>
        ) : totalItems > 0 ? (
          <div className={styles.menuIdiomaTableSurface} style={themeStyles.surface}>
            <div className={styles.menuIdiomaTableScroll}>
              <table className={styles.menuIdiomaTable} aria-label={t("menuIdiomaListTitle")}>
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
                          className={`${styles.menuIdiomaHeaderCell} ${getColumnClassName(header.column.id)}`}
                        >
                          {header.isPlaceholder ? null : (
                            <button
                              type="button"
                              className={styles.menuIdiomaSortButton}
                              onClick={header.column.getToggleSortingHandler()}
                              disabled={!header.column.getCanSort()}
                            >
                              <span className={styles.tableHeaderLabel}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                              {header.column.getCanSort() ? (
                                <span className={styles.menuIdiomaSortIndicator}>
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
                    <tr key={row.id} className={styles.menuIdiomaRow}>
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`${styles.menuIdiomaCell} ${getColumnClassName(cell.column.id)}`}
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
          <Text className={styles.empty}>{t("noMenuIdiomasFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default MenuIdiomaListPage;
