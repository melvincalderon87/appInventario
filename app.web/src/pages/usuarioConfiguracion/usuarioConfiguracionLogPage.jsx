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
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { UsuarioConfiguracionService } from "../../services/usuarioConfiguracionService";
import {
  getUsuarioConfiguracionThemeStyles,
  useUsuarioConfiguracionStyles,
} from "../../styles/pages/usuarioConfiguracion/usuarioConfiguracionPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useUsuarioConfiguracionStyles();

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

function UsuarioConfiguracionLogPage() {
  const styles = useUsuarioConfiguracionStyles();
  const themeStyles = getUsuarioConfiguracionThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idUsuario = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const returnToDefault = "/usuario/listar";
  const returnTo = (() => {
    const fromQuery = searchParams.get("returnTo");
    if (!fromQuery) {
      return returnToDefault;
    }

    try {
      return decodeURIComponent(fromQuery) || returnToDefault;
    } catch {
      return fromQuery;
    }
  })();
  const returnQuery = encodeURIComponent(returnTo);
  const navegarVolver = () =>
    navigate(
      `/usuarioconfiguracion/listar/${encodeURIComponent(idUsuario)}?returnTo=${returnQuery}`
    );

  useEffect(() => {
    let isMounted = true;

    UsuarioConfiguracionService.log(idUsuario)
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

        setError(loadError.message || t("userConfigurationLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idUsuario, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("userConfigurationLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("userConfigurationListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={navegarVolver}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("userConfigurationLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("userCode")}</TableHeaderCell>
                <TableHeaderCell>{t("userConfigurationTypeUser")}</TableHeaderCell>
                <TableHeaderCell>{t("userConfigurationRole")}</TableHeaderCell>
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
                      <UsuarioLink idUsuario={row.idUsuario} codUsuario={row.codUsuario} />
                    </TableCell>
                    <TableCell>{row.tipoUsuario}</TableCell>
                    <TableCell>{row.rol}</TableCell>
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

export default UsuarioConfiguracionLogPage;
