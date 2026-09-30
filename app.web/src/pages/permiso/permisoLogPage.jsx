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
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PermisoService } from "../../services/permisoService";
import {
  getRolPermisoThemeStyles,
  useRolPermisoStyles,
} from "../../styles/pages/permiso/rolPermisoPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function RolLink({ idRol, codRol }) {
  const styles = useRolPermisoStyles();

  if (!codRol) return "";
  if (!idRol) return codRol;

  return (
    <span className={styles.masterCell}>
      <Link className={styles.masterArrowLink} to={`/rol/visualizar/${encodeURIComponent(idRol)}`}>
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codRol}</span>
    </span>
  );
}

function MenuLink({ idMenu, codMenu, description }) {
  const styles = useRolPermisoStyles();

  const content = description ?? codMenu;

  if (!codMenu) return "";
  if (!idMenu) return content;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/menu/visualizar/${encodeURIComponent(idMenu)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{content}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useRolPermisoStyles();

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

function PermisoLogPage() {
  const styles = useRolPermisoStyles();
  const themeStyles = getRolPermisoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idRol = "", idMenu = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    PermisoService.log(idRol, idMenu)
      .then((data) => {
        if (!isMounted) return;

        const sortedLog = Array.isArray(data)
          ? [...data].sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0))
          : [];
        setLog(sortedLog);
      })
      .catch((loadError) => {
        if (!isMounted) return;

        if (loadError.message === "Sesion expirada") {
          navigate("/", { replace: true });
          return;
        }

        setError(loadError.message || t("rolePermissionLogLoadError"));
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [idRol, idMenu, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("rolePermissionLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("rolePermissionLogCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate(`/rol/permisos/${encodeURIComponent(idRol)}`)}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("rolePermissionLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("roleCode")}</TableHeaderCell>
                <TableHeaderCell>{t("permissionTypeCode")}</TableHeaderCell>
                <TableHeaderCell>{t("menuCodeShort")}</TableHeaderCell>
                <TableHeaderCell>{t("menuDescription")}</TableHeaderCell>
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
                  <TableRow
                    key={`${row.version ?? ""}-${row.codRol ?? ""}-${row.codMenu ?? ""}-${index}`}
                  >
                    <TableCell>{row.version}</TableCell>
                    <TableCell>{getAccionLogLabel(row.accionLog, t)}</TableCell>
                    <TableCell>
                      <RolLink idRol={row.rol?.idRol ?? row.idRol} codRol={row.codRol} />
                    </TableCell>
                    <TableCell>{row.codTipoPermiso}</TableCell>
                    <TableCell>
                      <MenuLink
                        idMenu={row.menu?.idMenu ?? row.idMenu}
                        codMenu={row.codMenu}
                        description={row.menu?.descripcion}
                      />
                    </TableCell>
                    <TableCell>{row.menu?.descripcion ?? ""}</TableCell>
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

export default PermisoLogPage;
