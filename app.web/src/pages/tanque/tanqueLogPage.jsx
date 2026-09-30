import { useEffect, useState } from "react";
import { MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { TanqueService } from "../../services/tanqueService";
import { getTanqueThemeStyles, useTanqueStyles } from "../../styles/pages/tanque/tanquePageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function TanqueLink({ idTanque, codTanque }) {
  const styles = useTanqueStyles();

  if (!codTanque) return "-";
  if (!idTanque) return codTanque;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/tanque/visualizar/${encodeURIComponent(idTanque)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codTanque}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useTanqueStyles();

  if (!codUsuario) return "-";
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

function isEmptyValue(value) {
  return value === null || value === undefined || value === "";
}

function LogField({ label, value }) {
  const styles = useTanqueStyles();

  return (
    <div className={styles.logFieldRow}>
      <Text className={styles.logFieldLabel}>{label}</Text>
      <div className={styles.logFieldValue}>{isEmptyValue(value) ? "-" : value}</div>
    </div>
  );
}

function TanqueLogPage() {
  const styles = useTanqueStyles();
  const themeStyles = getTanqueThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idTanque = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    TanqueService.log(idTanque)
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

        setError(loadError.message || t("tankLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idTanque, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("tankLogTitle")}</Title2>
          <Text className={styles.subtitle}>{t("tankListCount", { count: log.length })}</Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/tanque/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.logSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : log.length > 0 ? (
          <div className={styles.logAccordionList}>
            {log.map((row, index) => (
              <details
                key={`${row.version}-${index}`}
                className={styles.logAccordionItem}
                open={index === 0}
              >
                <summary className={styles.logSummary}>
                  <span className={styles.logSummaryMain}>
                    <Text weight="semibold" className={styles.userName}>
                      {t("version")} {row.version ?? "-"}
                    </Text>
                    <Text className={styles.metaValue}>{getAccionLogLabel(row.accionLog, t)}</Text>
                  </span>
                  <span className={styles.logSummaryMeta}>
                    <Text className={styles.metaLabel}>{t("tankCode")}</Text>
                    <span>
                      <TanqueLink idTanque={row.idTanque} codTanque={row.codTanque} />
                    </span>
                  </span>
                  <span className={styles.logSummaryMeta}>
                    <Text className={styles.metaLabel}>{t("tankName")}</Text>
                    <Text className={styles.metaValue}>{row.tanque || "-"}</Text>
                  </span>
                  <span className={styles.logSummaryMeta}>
                    <Text className={styles.metaLabel}>{t("tankStatus")}</Text>
                    <Text className={styles.metaValue}>
                      {row.estatus ? t("active") : t("inactive")}
                    </Text>
                  </span>
                </summary>

                <div className={styles.logFields}>
                  <LogField
                    label={t("tankCode")}
                    value={<TanqueLink idTanque={row.idTanque} codTanque={row.codTanque} />}
                  />
                  <LogField label={t("tankProduct")} value={row.producto} />
                  <LogField label={t("tankType")} value={row.tipoTanque} />
                  <LogField label={t("tankName")} value={row.tanque} />
                  <LogField label={t("tankShortDescription")} value={row.descripcionCorta} />
                  <LogField label={t("tankMencod")} value={row.mencod} />
                  <LogField label={t("tankMaximumHeightFeet")} value={row.alturaMaximaPies} />
                  <LogField label={t("tankMaximumHeightInches")} value={row.alturaMaximaPulgadas} />
                  <LogField label={t("tankRoofPosition")} value={row.tipoPosiconTecho} />
                  <LogField label={t("tankMinimumHeightFeet")} value={row.alturaMinimaPies} />
                  <LogField label={t("tankMinimumHeightInches")} value={row.alturaMinimaPulgadas} />
                  <LogField label={t("tankVolumeMaximum")} value={row.volumenMaximo} />
                  <LogField label={t("tankVolumeMinimum")} value={row.volumenMinimo} />
                  <LogField label={t("tankVolumeRoofHigh")} value={row.volumenTechoPosicionAlta} />
                  <LogField label={t("tankVolumeRoofLow")} value={row.volumenTechoPosicionBaja} />
                  <LogField
                    label={t("tankOwnConsumption")}
                    value={row.consumoPropio ? t("yes") : t("no")}
                  />
                  <LogField label={t("tankComment")} value={row.comentario} />
                  <LogField
                    label={t("tankStatus")}
                    value={row.estatus ? t("active") : t("inactive")}
                  />
                  <LogField label={t("version")} value={row.version} />
                  <LogField
                    label={t("createdBy")}
                    value={
                      <UsuarioLink
                        idUsuario={row.idUsuarioCreacion}
                        codUsuario={row.codUsuarioCreacion}
                      />
                    }
                  />
                  <LogField
                    label={t("createdAt")}
                    value={formatDateByLanguage(row.fechaCreacion, i18n.language)}
                  />
                  <LogField
                    label={t("updatedBy")}
                    value={
                      <UsuarioLink
                        idUsuario={row.idUsuarioActualizacion}
                        codUsuario={row.codUsuarioActualizacion}
                      />
                    }
                  />
                  <LogField
                    label={t("updatedAt")}
                    value={formatDateByLanguage(row.fechaActualizacion, i18n.language)}
                  />
                  <LogField
                    label={t("deletedBy")}
                    value={
                      <UsuarioLink
                        idUsuario={row.idUsuarioEliminacion}
                        codUsuario={row.codUsuarioEliminacion}
                      />
                    }
                  />
                  <LogField
                    label={t("deletedAt")}
                    value={formatDateByLanguage(row.fechaEliminacion, i18n.language)}
                  />
                  <LogField label={t("actionLog")} value={getAccionLogLabel(row.accionLog, t)} />
                </div>
              </details>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>{t("noLogFound")}</Text>
        )}
      </div>
    </section>
  );
}

export default TanqueLogPage;
