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
import { TuberiaService } from "../../services/tuberiaService";
import {
  getTuberiaThemeStyles,
  useTuberiaStyles,
} from "../../styles/pages/tuberia/tuberiaPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function movementLabel(tipoMovimiento, t) {
  const value = String(tipoMovimiento ?? "")
    .trim()
    .toUpperCase();
  if (value === "ENTRADA") return t("pipelineMovementEntry");
  if (value === "SALIDA") return t("pipelineMovementExit");
  if (value === "NO APLICA") return t("pipelineMovementNotApplicable");
  return "-";
}

function TuberiaLink({ idTuberia, codTuberia }) {
  const styles = useTuberiaStyles();

  if (!codTuberia) return "";
  if (!idTuberia) return codTuberia;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/tuberia/visualizar/${encodeURIComponent(idTuberia)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codTuberia}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useTuberiaStyles();

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

function TuberiaLogPage() {
  const styles = useTuberiaStyles();
  const themeStyles = getTuberiaThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idTuberia = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    TuberiaService.log(idTuberia)
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

        setError(loadError.message || t("pipelineLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idTuberia, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("pipelineLogTitle")}</Title2>
          <Text className={styles.subtitle}>{t("pipelineListCount", { count: log.length })}</Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/tuberia/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("pipelineLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineCode")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineTank")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineProductType")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineProduct")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineLocation")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineLineSection")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineDiameterStart")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineDiameterEnd")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineVolume")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineCertificationDate")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineInspectionCompany")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineMovementType")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineComment")}</TableHeaderCell>
                <TableHeaderCell>{t("pipelineStatus")}</TableHeaderCell>
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
                      <TuberiaLink idTuberia={row.idTuberia} codTuberia={row.codTuberia} />
                    </TableCell>
                    <TableCell>{row.tanque || "-"}</TableCell>
                    <TableCell>{row.tipoProducto}</TableCell>
                    <TableCell>{row.producto}</TableCell>
                    <TableCell>{row.ubicacion}</TableCell>
                    <TableCell>{row.tramoLinea}</TableCell>
                    <TableCell>{row.diametroInicio}</TableCell>
                    <TableCell>{row.diametroFinal}</TableCell>
                    <TableCell>{row.volumen}</TableCell>
                    <TableCell>
                      {formatDateByLanguage(row.fechaCertificacion, i18n.language)}
                    </TableCell>
                    <TableCell>{row.companiaInspeccion}</TableCell>
                    <TableCell>{movementLabel(row.tipoMovimiento, t)}</TableCell>
                    <TableCell>{row.comentario}</TableCell>
                    <TableCell>{t(row.estatus !== false ? "active" : "inactive")}</TableCell>
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
                  <TableCell colSpan={22}>
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

export default TuberiaLogPage;
