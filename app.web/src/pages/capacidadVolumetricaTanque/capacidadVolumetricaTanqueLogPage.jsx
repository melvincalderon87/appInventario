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
import { CapacidadVolumetricaTanqueService } from "../../services/capacidadVolumetricaTanqueService";
import {
  getCapacidadVolumetricaTanqueThemeStyles,
  useCapacidadVolumetricaTanqueStyles,
} from "../../styles/pages/capacidadVolumetricaTanque/capacidadVolumetricaTanquePageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function CapacidadVolumetricaTanqueLink({
  idCapacidadVolumetricaTanque,
  codCapacidadVolumetricaTanque,
}) {
  const styles = useCapacidadVolumetricaTanqueStyles();

  if (!codCapacidadVolumetricaTanque) return "";
  if (!idCapacidadVolumetricaTanque) return codCapacidadVolumetricaTanque;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/capacidadvolumetricatanque/visualizar/${encodeURIComponent(idCapacidadVolumetricaTanque)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codCapacidadVolumetricaTanque}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useCapacidadVolumetricaTanqueStyles();

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

function CapacidadVolumetricaTanqueLogPage() {
  const styles = useCapacidadVolumetricaTanqueStyles();
  const themeStyles = getCapacidadVolumetricaTanqueThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idCapacidadVolumetricaTanque = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    CapacidadVolumetricaTanqueService.log(idCapacidadVolumetricaTanque)
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

        setError(loadError.message || t("tankCalibrationLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idCapacidadVolumetricaTanque, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("tankCalibrationLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("tankCalibrationListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/capacidadvolumetricatanque/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("tankCalibrationLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationCode")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationTank")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationProduct")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationInspectionCompany")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationDate")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationComments")}</TableHeaderCell>
                <TableHeaderCell>{t("tankCalibrationCurrent")}</TableHeaderCell>
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
                      <CapacidadVolumetricaTanqueLink
                        idCapacidadVolumetricaTanque={row.idCapacidadVolumetricaTanque}
                        codCapacidadVolumetricaTanque={row.codCapacidadVolumetricaTanque}
                      />
                    </TableCell>
                    <TableCell>{row.tanque}</TableCell>
                    <TableCell>{row.producto}</TableCell>
                    <TableCell>{row.companiaInspeccion}</TableCell>
                    <TableCell>
                      {formatDateByLanguage(row.fechaCalibracion, i18n.language)}
                    </TableCell>
                    <TableCell>{row.comentarios}</TableCell>
                    <TableCell>{row.esActual ? t("yes") : t("no")}</TableCell>
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

export default CapacidadVolumetricaTanqueLogPage;
