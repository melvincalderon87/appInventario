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
import { CalibracionCombustibleService } from "../../services/calibracionCombustibleService";
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

function CalibracionCombustibleLogPage() {
  const styles = useTipoProductoStyles();
  const themeStyles = getTipoProductoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idCalibracionCombustible = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language || "es-GT", { maximumFractionDigits: 4 }),
    [i18n.language]
  );

  useEffect(() => {
    let isMounted = true;

    CalibracionCombustibleService.log(idCalibracionCombustible)
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

        setError(loadError.message || t("armCalibrationLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idCalibracionCombustible, navigate, t]);

  const formatNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numberFormatter.format(numericValue) : "-";
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("armCalibrationLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("armCalibrationListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/calibracioncombustible/listar")}
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
            <Table aria-label={t("armCalibrationLogTitle")}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>{t("version")}</TableHeaderCell>
                  <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationCode")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationDate")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationNextDate")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationBay")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationArm")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationProduct")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationTechnician")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationInspectionCompany")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationQuantity")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationStartTime")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationEndTime")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationTotalTime")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationFactor")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationDeviationPercent")}</TableHeaderCell>
                  <TableHeaderCell>{t("armCalibrationDispatchedVolume")}</TableHeaderCell>
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
                      <TableCell>{row.codCalibracionCombustible}</TableCell>
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

export default CalibracionCombustibleLogPage;
