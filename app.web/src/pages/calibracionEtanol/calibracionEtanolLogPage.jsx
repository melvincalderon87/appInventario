import { useEffect, useMemo, useState } from "react";
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
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { CalibracionEtanolService } from "../../services/calibracionEtanolService";
import {
  getTipoProductoThemeStyles,
  useTipoProductoStyles,
} from "../../styles/pages/tipoProducto/tipoProductoPageStyles";
import { getAccionLogLabel } from "../../utils/accionLog";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";

function valueOrDash(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function CalibracionEtanolLogPage() {
  const styles = useTipoProductoStyles();
  const themeStyles = getTipoProductoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idCalibracionEtanol = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language || "es-GT", { maximumFractionDigits: 4 }),
    [i18n.language]
  );

  useEffect(() => {
    let isMounted = true;

    CalibracionEtanolService.log(idCalibracionEtanol)
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

        setError(loadError.message || t("ethanolCalibrationLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idCalibracionEtanol, navigate, t]);

  const formatNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numberFormatter.format(numericValue) : "-";
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("ethanolCalibrationLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("ethanolCalibrationListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/calibracionetanol/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <div className={styles.responsiveGrid}>
            <Table aria-label={t("ethanolCalibrationLogTitle")}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>{t("version")}</TableHeaderCell>
                  <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationCode")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationDate")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationNextDate")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationBay")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationArm")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationProduct")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationTechnician")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationInspectionCompany")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationQuantity")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationStartTime")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationEndTime")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationTotalTime")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationFactor")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationDeviationPercent")}</TableHeaderCell>
                  <TableHeaderCell>{t("ethanolCalibrationDispatchedVolume")}</TableHeaderCell>
                  <TableHeaderCell>{t("status")}</TableHeaderCell>
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
                      <TableCell>{row.codCalibracionEtanol}</TableCell>
                      <TableCell>
                        {valueOrDash(formatDateByLanguage(row.fecha, i18n.language))}
                      </TableCell>
                      <TableCell>
                        {valueOrDash(formatDateByLanguage(row.proximaFecha, i18n.language))}
                      </TableCell>
                      <TableCell>{valueOrDash(row.bahia)}</TableCell>
                      <TableCell>{valueOrDash(row.brazo)}</TableCell>
                      <TableCell>{valueOrDash(row.producto)}</TableCell>
                      <TableCell>{valueOrDash(row.personal)}</TableCell>
                      <TableCell>{valueOrDash(row.companiaInspeccion)}</TableCell>
                      <TableCell>{formatNumber(row.cantidadCalibracion)}</TableCell>
                      <TableCell>{valueOrDash(row.horaInicio)}</TableCell>
                      <TableCell>{valueOrDash(row.horaFinal)}</TableCell>
                      <TableCell>{formatNumber(row.tiempoTotal)}</TableCell>
                      <TableCell>{formatNumber(row.factorCalibracion)}</TableCell>
                      <TableCell>{formatNumber(row.porcentajeDesviacion)}</TableCell>
                      <TableCell>{formatNumber(row.volumenDespachado)}</TableCell>
                      <TableCell>{t(row.estatus !== false ? "active" : "inactive")}</TableCell>
                      <TableCell>{valueOrDash(row.codUsuarioCreacion)}</TableCell>
                      <TableCell>
                        {valueOrDash(formatDateByLanguage(row.fechaCreacion, i18n.language))}
                      </TableCell>
                      <TableCell>{valueOrDash(row.codUsuarioActualizacion)}</TableCell>
                      <TableCell>
                        {valueOrDash(formatDateByLanguage(row.fechaActualizacion, i18n.language))}
                      </TableCell>
                      <TableCell>{valueOrDash(row.codUsuarioEliminacion)}</TableCell>
                      <TableCell>
                        {valueOrDash(formatDateByLanguage(row.fechaEliminacion, i18n.language))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={24}>
                      <Text className={styles.empty}>{t("noLogFound")}</Text>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}

export default CalibracionEtanolLogPage;
