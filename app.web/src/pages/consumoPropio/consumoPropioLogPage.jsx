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
import { ConsumoPropioService } from "../../services/consumoPropioService";
import {
  getConsumoPropioThemeStyles,
  useConsumoPropioStyles,
} from "../../styles/pages/consumoPropio/consumoPropioPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function ConsumoPropioLink({ idConsumoPropio, codConsumoPropio }) {
  const styles = useConsumoPropioStyles();

  if (!codConsumoPropio) return "";
  if (!idConsumoPropio) return codConsumoPropio;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/consumopropio/visualizar/${encodeURIComponent(idConsumoPropio)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codConsumoPropio}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useConsumoPropioStyles();

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

function ConsumoPropioLogPage() {
  const styles = useConsumoPropioStyles();
  const themeStyles = getConsumoPropioThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idConsumoPropio = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    ConsumoPropioService.log(idConsumoPropio)
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

        setError(loadError.message || t("ownConsumptionLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idConsumoPropio, navigate, t]);

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("ownConsumptionLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("ownConsumptionListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/consumopropio/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("ownConsumptionLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionCode")}</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionTank")}</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionDate")}</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionHeightFeet")} '</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionHeightInches")} &quot;</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionSixteenths")}</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionPreviousQuantity")}</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionQuantity")}</TableHeaderCell>
                <TableHeaderCell>{t("ownConsumptionCurrentQuantity")}</TableHeaderCell>
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
                      <ConsumoPropioLink
                        idConsumoPropio={row.idConsumoPropio}
                        codConsumoPropio={row.codConsumoPropio}
                      />
                    </TableCell>
                    <TableCell>{row.tanque}</TableCell>
                    <TableCell>{formatDateByLanguage(row.fecha, i18n.language)}</TableCell>
                    <TableCell>{row.pies}</TableCell>
                    <TableCell>{row.pulgadas}</TableCell>
                    <TableCell>{row.dieciseisavos}</TableCell>
                    <TableCell>{row.cantidadAnterior}</TableCell>
                    <TableCell>{row.cantidad}</TableCell>
                    <TableCell>{row.cantidadActual}</TableCell>
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
                  <TableCell colSpan={18}>
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

export default ConsumoPropioLogPage;
