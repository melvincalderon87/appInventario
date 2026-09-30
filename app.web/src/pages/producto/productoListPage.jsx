import { useMemo } from "react";
import { Input, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { useState } from "react";
import { Search } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { ListViewModeToggle } from "../../components/common/ListViewModeToggle";
import { MasterListTableHeader } from "../../components/common/MasterListTableHeader";
import { PaginationToolbar } from "../../components/common/PaginationToolbar";
import { usePermisosPantalla } from "../../context/permisosPantallaContext";
import { useServerPagination } from "../../hooks/useServerPagination";
import { ProductoService } from "../../services/productoService";
import {
  getProductoThemeStyles,
  useProductoStyles,
} from "../../styles/pages/producto/productoPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function ProductoListPage() {
  const styles = useProductoStyles();
  const themeStyles = getProductoThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codProducto:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const productosQuery = useQuery({
    queryKey: ["productos-listado", page, pageSize, search, sort],
    queryFn: () => ProductoService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const productosPage = productosQuery.data ?? emptyPagedResult;
  const productos = useMemo(
    () => (Array.isArray(productosPage.items) ? productosPage.items : []),
    [productosPage.items]
  );
  const loading = productosQuery.isLoading;
  const busy = productosQuery.isFetching;
  const error = productosQuery.isError
    ? productosQuery.error?.message || t("productListLoadError")
    : "";

  const goTo = (route, producto) => {
    navigate(`${route}/${encodeURIComponent(producto.idProducto)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("productListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("productListCount", { count: productosPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/producto/agregar")}
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
          placeholder={t("searchProducts")}
          aria-label={t("searchProducts")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={productosPage.page}
          pageSize={productosPage.pageSize}
          totalCount={productosPage.totalCount}
          totalPages={productosPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingProducts")} />
          </div>
        ) : productos.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("productListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("productCode"), sortKey: "codProducto" },
                  { label: t("productType"), sortKey: "tipoProducto" },
                  { label: t("productCategory"), sortKey: "tipo" },
                ]}
              />
            ) : null}
            {productos.map((producto) => (
              <article
                key={producto.idProducto || producto.codProducto}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("productCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {producto.codProducto}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("productType")}</Text>
                      <Text className={styles.userName}>{producto.tipoProducto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("productCategory")}</Text>
                      <Text className={styles.userName}>{producto.tipo}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("productName")}</Text>
                      <Text className={styles.userName}>{producto.producto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("productShortDescription")}</Text>
                      <Text className={styles.userName}>{producto.descripcionCorta}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("productStatus")}</Text>
                      <Text className={styles.userName}>
                        {t(producto.estatus !== false ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/producto/visualizar", producto)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/producto/editar", producto)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/producto/eliminar", producto)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/producto/log", producto)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noProductsFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default ProductoListPage;
