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
import { PersonalService } from "../../services/personalService";
import {
  getPersonalThemeStyles,
  usePersonalStyles,
} from "../../styles/pages/personal/personalPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function PersonalLink({ idPersonal, codPersonal }) {
  const styles = usePersonalStyles();

  if (!codPersonal) return "";
  if (!idPersonal) return codPersonal;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/personal/visualizar/${encodeURIComponent(idPersonal)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codPersonal}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = usePersonalStyles();

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

function PersonalLogPage() {
  const styles = usePersonalStyles();
  const themeStyles = getPersonalThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idPersonal = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    PersonalService.log(idPersonal)
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

        setError(loadError.message || t("staffLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idPersonal, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("staffLogTitle")}</Title2>
          <Text className={styles.subtitle}>{t("staffListCount", { count: log.length })}</Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/personal/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("staffLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("staffCode")}</TableHeaderCell>
                <TableHeaderCell>{t("staffTechnicianCode")}</TableHeaderCell>
                <TableHeaderCell>{t("staffName")}</TableHeaderCell>
                <TableHeaderCell>{t("staffPosition")}</TableHeaderCell>
                <TableHeaderCell>{t("staffIsTechnician")}</TableHeaderCell>
                <TableHeaderCell>{t("status")}</TableHeaderCell>
                <TableHeaderCell>{t("staffPhoto")}</TableHeaderCell>
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
                      <PersonalLink idPersonal={row.idPersonal} codPersonal={row.codPersonal} />
                    </TableCell>
                    <TableCell>{row.codTecnico}</TableCell>
                    <TableCell>{row.nombre}</TableCell>
                    <TableCell>{row.puesto}</TableCell>
                    <TableCell>{t(row.esTecnico ? "yes" : "no")}</TableCell>
                    <TableCell>{t(row.estatus ? "active" : "inactive")}</TableCell>
                    <TableCell>{row.fotoNombreArchivo || "-"}</TableCell>
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
                  <TableCell colSpan={15}>
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

export default PersonalLogPage;
