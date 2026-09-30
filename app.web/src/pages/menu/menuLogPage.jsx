import { useEffect, useState } from "react";
import {
  MessageBar,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { MenuService } from "../../services/menuService";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function MenuLink({ idMenu, codMenu }) {
  const styles = useMenuStyles();

  if (!codMenu) return "";
  if (!idMenu) return codMenu;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/menu/visualizar/${encodeURIComponent(idMenu)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codMenu}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useMenuStyles();

  if (!codUsuario) return "";
  if (!idUsuario) return codUsuario;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/usuario/visualizar/${encodeURIComponent(idUsuario)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codUsuario}</span>
    </span>
  );
}

function MenuLogPage() {
  const styles = useMenuStyles();
  const themeStyles = getMenuThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idMenu = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    MenuService.log(idMenu)
      .then((data) => {
        if (isMounted) {
          const sortedLog = Array.isArray(data)
            ? [...data].sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0))
            : [];
          setLog(sortedLog);
        }
      })
      .catch((loadError) => {
        if (!isMounted) return;

        if (loadError.message === "Sesion expirada") {
          navigate("/", { replace: true });
          return;
        }

        setError(loadError.message || t("menuLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idMenu, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("menuLogTitle")}</Title2>
          <Text className={styles.subtitle}>{t("menuListCount", { count: log.length })}</Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/menu/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("menuLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("menuCode")}</TableHeaderCell>
                <TableHeaderCell>{t("menuDescription")}</TableHeaderCell>
                <TableHeaderCell>{t("menuLink")}</TableHeaderCell>
                <TableHeaderCell>{t("menuStatus")}</TableHeaderCell>
                <TableHeaderCell>{t("createdBy")}</TableHeaderCell>
                <TableHeaderCell>{t("createdAt")}</TableHeaderCell>
                <TableHeaderCell>{t("updatedBy")}</TableHeaderCell>
                <TableHeaderCell>{t("updatedAt")}</TableHeaderCell>
                <TableHeaderCell>{t("deletedBy")}</TableHeaderCell>
                <TableHeaderCell>{t("deletedAt")}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.length > 0 ? (
                log.map((row, index) => (
                  <TableRow key={`${row.version}-${index}`}>
                    <TableCell>{row.version}</TableCell>
                    <TableCell>{getAccionLogLabel(row.accionLog, t)}</TableCell>
                    <TableCell>
                      <MenuLink idMenu={row.idMenu} codMenu={row.codMenu} />
                    </TableCell>
                    <TableCell>{row.descripcion}</TableCell>
                    <TableCell>{row.link}</TableCell>
                    <TableCell>{row.estatus ? t("active") : t("inactive")}</TableCell>
                    <TableCell>
                      <UsuarioLink
                        idUsuario={row.idUsuarioCreacion}
                        codUsuario={row.codUsuarioCreacion}
                      />
                    </TableCell>
                    <TableCell>{formatDateByLanguage(row.fechaCreacion, i18n.language)}</TableCell>
                    <TableCell>
                      <UsuarioLink
                        idUsuario={row.idUsuarioActualizacion}
                        codUsuario={row.codUsuarioActualizacion}
                      />
                    </TableCell>
                    <TableCell>
                      {formatDateByLanguage(row.fechaActualizacion, i18n.language)}
                    </TableCell>
                    <TableCell>
                      <UsuarioLink
                        idUsuario={row.idUsuarioEliminacion}
                        codUsuario={row.codUsuarioEliminacion}
                      />
                    </TableCell>
                    <TableCell>
                      {formatDateByLanguage(row.fechaEliminacion, i18n.language)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12}>
                    <Text className={styles.empty}>{t("noLogFound")}</Text>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}

export default MenuLogPage;
