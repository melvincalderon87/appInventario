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
import { MedicionTanqueTierraService } from "../../services/medicionTanqueTierraService";
import {
  getMedicionTanqueTierraThemeStyles,
  useMedicionTanqueTierraStyles,
} from "../../styles/pages/medicionTanqueTierra/medicionTanqueTierraPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage, formatDateFilterByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function MedicionLink({ idMedicionTanqueTierra, codMedicionTanqueTierra }) {
  const styles = useMedicionTanqueTierraStyles();

  if (!codMedicionTanqueTierra) return "";
  if (!idMedicionTanqueTierra) return codMedicionTanqueTierra;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/mediciontanquetierra/visualizar/${encodeURIComponent(idMedicionTanqueTierra)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codMedicionTanqueTierra}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useMedicionTanqueTierraStyles();

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

function MedicionTanqueTierraLogPage() {
  const styles = useMedicionTanqueTierraStyles();
  const themeStyles = getMedicionTanqueTierraThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idMedicionTanqueTierra = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    MedicionTanqueTierraService.log(idMedicionTanqueTierra)
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

        setError(loadError.message || t("groundTankMeasurementLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idMedicionTanqueTierra, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("groundTankMeasurementLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("groundTankMeasurementListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/mediciontanquetierra/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("groundTankMeasurementLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("groundTankMeasurementCode")}</TableHeaderCell>
                <TableHeaderCell>{t("groundTankMeasurementDate")}</TableHeaderCell>
                <TableHeaderCell>{t("groundTankMeasurementShip")}</TableHeaderCell>
                <TableHeaderCell>{t("groundTankMeasurementPartner")}</TableHeaderCell>
                <TableHeaderCell>{t("groundTankMeasurementProduct")}</TableHeaderCell>
                <TableHeaderCell>{t("groundTankMeasurementInspectionCompany")}</TableHeaderCell>
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
                      <MedicionLink
                        idMedicionTanqueTierra={row.idMedicionTanqueTierra}
                        codMedicionTanqueTierra={row.codMedicionTanqueTierra}
                      />
                    </TableCell>
                    <TableCell>{formatDateFilterByLanguage(row.fecha, i18n.language)}</TableCell>
                    <TableCell>{row.barco}</TableCell>
                    <TableCell>{row.suplidor}</TableCell>
                    <TableCell>{row.producto}</TableCell>
                    <TableCell>{row.companiaInspeccion}</TableCell>
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
                  <TableCell colSpan={14}>
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

export default MedicionTanqueTierraLogPage;
