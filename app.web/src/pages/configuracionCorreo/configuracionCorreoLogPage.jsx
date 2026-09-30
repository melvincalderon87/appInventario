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
import { ConfiguracionCorreoService } from "../../services/configuracionCorreoService";
import {
  getConfiguracionCorreoThemeStyles,
  useConfiguracionCorreoStyles,
} from "../../styles/pages/configuracionCorreo/configuracionCorreoPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function ConfiguracionCorreoLink({ idConfiguracionCorreo, codConfiguracionCorreo }) {
  const styles = useConfiguracionCorreoStyles();

  if (!codConfiguracionCorreo) return "";
  if (!idConfiguracionCorreo) return codConfiguracionCorreo;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/configuracioncorreo/visualizar/${encodeURIComponent(idConfiguracionCorreo)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codConfiguracionCorreo}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useConfiguracionCorreoStyles();

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

function ConfiguracionCorreoLogPage() {
  const styles = useConfiguracionCorreoStyles();
  const themeStyles = getConfiguracionCorreoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idConfiguracionCorreo = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    ConfiguracionCorreoService.log(idConfiguracionCorreo)
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

        setError(loadError.message || t("emailConfigurationLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idConfiguracionCorreo, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("emailConfigurationLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("emailConfigurationListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/configuracioncorreo/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("emailConfigurationLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationCode")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationDescription")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationEmailAddress")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationUserName")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationAuthProvider")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationOutgoingServer")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationOutgoingPort")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationOutgoingSsl")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationAuthStatus")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationTokenExpiration")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationLastAuth")}</TableHeaderCell>
                <TableHeaderCell>{t("emailConfigurationStatus")}</TableHeaderCell>
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
                      <ConfiguracionCorreoLink
                        idConfiguracionCorreo={row.idConfiguracionCorreo}
                        codConfiguracionCorreo={row.codConfiguracionCorreo}
                      />
                    </TableCell>
                    <TableCell>{row.descripcion}</TableCell>
                    <TableCell>{row.direccionCorreo}</TableCell>
                    <TableCell>{row.nombreUsuario}</TableCell>
                    <TableCell>
                      {t(
                        `emailConfigurationProvider${
                          row.proveedorAutenticacion === "Personalizado"
                            ? "SMTP"
                            : row.proveedorAutenticacion || "SMTP"
                        }`
                      )}
                    </TableCell>
                    <TableCell>{row.servidorSalida}</TableCell>
                    <TableCell>{row.puertoSalida}</TableCell>
                    <TableCell>{row.sslSalida ? t("yes") : t("no")}</TableCell>
                    <TableCell>{row.estatusAutenticacion}</TableCell>
                    <TableCell>
                      {formatDateByLanguage(row.fechaExpiracionToken, i18n.language)}
                    </TableCell>
                    <TableCell>
                      {formatDateByLanguage(row.fechaUltimaAutenticacion, i18n.language)}
                    </TableCell>
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
                  <TableCell colSpan={20}>
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

export default ConfiguracionCorreoLogPage;
