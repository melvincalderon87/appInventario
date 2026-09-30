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
import { PersonalService } from "../../services/personalService";
import {
  getPersonalThemeStyles,
  usePersonalStyles,
} from "../../styles/pages/personal/personalPageStyles";
import { emptyPagedResult } from "../../utils/pagination";

function PersonalListPage() {
  const styles = usePersonalStyles();
  const themeStyles = getPersonalThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisosPantalla();
  const pagination = useServerPagination("codPersonal:asc");
  const { page, pageSize, search, sort, params, setPage, setPageSize, setSearch, setSort } =
    pagination;
  const [tableView, setTableView] = useState(false);
  const personalQuery = useQuery({
    queryKey: ["personal-listado", page, pageSize, search, sort],
    queryFn: () => PersonalService.listado(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
  const personalPage = personalQuery.data ?? emptyPagedResult;
  const personal = useMemo(
    () => (Array.isArray(personalPage.items) ? personalPage.items : []),
    [personalPage.items]
  );
  const loading = personalQuery.isLoading;
  const busy = personalQuery.isFetching;
  const error = personalQuery.isError
    ? personalQuery.error?.message || t("staffListLoadError")
    : "";

  const goTo = (route, item) => {
    navigate(`${route}/${encodeURIComponent(item.idPersonal)}`);
  };

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>{t("staffListTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("staffListCount", { count: personalPage.totalCount })}
          </Text>
        </div>
        {tienePermiso("agregar") ? (
          <ListActionButton
            action="agregar"
            label={t("add")}
            text={t("add")}
            onClick={() => navigate("/personal/agregar")}
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
          placeholder={t("searchStaff")}
          aria-label={t("searchStaff")}
        />
      </div>

      <div className={styles.listSurface}>
        <ListViewModeToggle tableView={tableView} onChange={setTableView} t={t} />
        <PaginationToolbar
          page={personalPage.page}
          pageSize={personalPage.pageSize}
          totalCount={personalPage.totalCount}
          totalPages={personalPage.totalPages}
          loading={busy}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingStaff")} />
          </div>
        ) : personal.length > 0 ? (
          <div
            className={tableView ? styles.tableMode : styles.cardGrid}
            aria-label={t("staffListTitle")}
          >
            {tableView ? (
              <MasterListTableHeader
                styles={styles}
                t={t}
                sort={sort}
                onSortChange={setSort}
                columns={[
                  { label: t("staffCode"), sortKey: "codPersonal" },
                  { label: t("staffName"), sortKey: "personal" },
                  { label: t("staffTechnicianCode"), sortKey: "codigoTecnico" },
                ]}
              />
            ) : null}
            {personal.map((item) => (
              <article
                key={item.idPersonal || item.codPersonal}
                className={tableView ? styles.tableCard : styles.userCard}
                style={themeStyles.surface}
              >
                <div className={styles.cardHeader}>
                  <div className={tableView ? styles.tableIdentity : styles.identity}>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("staffCode")}</Text>
                      <Text weight="semibold" className={styles.userCode}>
                        {item.codPersonal}
                      </Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("staffName")}</Text>
                      <Text className={styles.userName}>{item.nombre}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("staffTechnicianCode")}</Text>
                      <Text className={styles.userName}>{item.codTecnico || "-"}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("staffPosition")}</Text>
                      <Text className={styles.userName}>{item.puesto}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("staffIsTechnician")}</Text>
                      <Text className={styles.userName}>{t(item.esTecnico ? "yes" : "no")}</Text>
                    </div>
                    <div className={styles.cardField}>
                      <Text className={styles.metaLabel}>{t("status")}</Text>
                      <Text className={styles.userName}>
                        {t(item.estatus ? "active" : "inactive")}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className={tableView ? styles.tableModeActions : styles.actions}>
                  {tienePermiso("visualizar") ? (
                    <ListActionButton
                      action="visualizar"
                      label={t("view")}
                      onClick={() => goTo("/personal/visualizar", item)}
                    />
                  ) : null}
                  {tienePermiso("editar") ? (
                    <ListActionButton
                      action="editar"
                      label={t("edit")}
                      onClick={() => goTo("/personal/editar", item)}
                    />
                  ) : null}
                  {tienePermiso("eliminar") ? (
                    <ListActionButton
                      action="eliminar"
                      label={t("delete")}
                      onClick={() => goTo("/personal/eliminar", item)}
                    />
                  ) : null}
                  {tienePermiso("log") ? (
                    <ListActionButton
                      action="log"
                      label={t("log")}
                      onClick={() => goTo("/personal/log", item)}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noStaffFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default PersonalListPage;
