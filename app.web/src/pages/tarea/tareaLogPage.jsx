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
import { TareaService } from "../../services/tareaService";
import { getTareaThemeStyles, useTareaStyles } from "../../styles/pages/tarea/tareaPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function TareaLink({ idTarea, codTarea }) {
  const styles = useTareaStyles();

  if (!codTarea) return "";
  if (!idTarea) return codTarea;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/tarea/visualizar/${encodeURIComponent(idTarea)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codTarea}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useTareaStyles();

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

function TareaLogPage() {
  const styles = useTareaStyles();
  const themeStyles = getTareaThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idTarea = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    TareaService.log(idTarea)
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

        setError(loadError.message || t("taskLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idTarea, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("taskLogTitle")}</Title2>
          <Text className={styles.subtitle}>{t("taskListCount", { count: log.length })}</Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/tarea/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.listSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("taskLogTitle")}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("taskCode")}</TableHeaderCell>
                <TableHeaderCell>{t("taskDescription")}</TableHeaderCell>
                <TableHeaderCell>{t("taskTime")}</TableHeaderCell>
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
                      <TareaLink idTarea={row.idTarea} codTarea={row.codTarea} />
                    </TableCell>
                    <TableCell>{row.descripcion}</TableCell>
                    <TableCell>{row.tiempo}</TableCell>
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
                  <TableCell colSpan={11}>
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

export default TareaLogPage;
