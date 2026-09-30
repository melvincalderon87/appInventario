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
import { ColoranteService } from "../../services/coloranteService";
import {
  getColoranteThemeStyles,
  useColoranteStyles,
} from "../../styles/pages/colorante/colorantePageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function ColoranteLink({ idColorante, codDocumento }) {
  const styles = useColoranteStyles();

  if (!codDocumento) return "";
  if (!idColorante) return String(codDocumento);

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/colorante/visualizar/${encodeURIComponent(idColorante)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codDocumento}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = useColoranteStyles();

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

function ColoranteLogPage() {
  const styles = useColoranteStyles();
  const themeStyles = getColoranteThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idColorante = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    ColoranteService.log(idColorante)
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

        setError(loadError.message || t("colorantLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idColorante, navigate, t]);

  const movimientoLabel = (tipoMovimiento) => {
    const value = String(tipoMovimiento ?? "").toUpperCase();
    if (value === "AJUSTE") return t("colorantMovementAdjust");
    if (value === "INYECTAR_MANIFOLD") return t("colorantMovementInjection");
    if (value === "PRESTAMO") return t("colorantMovementLoan");
    if (value === "SALIDA") return t("colorantMovementOut");
    return t("colorantMovementIn");
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("colorantLogTitle")}</Title2>
          <Text className={styles.subtitle}>{t("colorantListCount", { count: log.length })}</Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate("/colorante/listar")}
        />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("colorantLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantCode")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantProduct")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantDate")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantMovement")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantShipCode")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantShip")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantPartnerCode")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantPartner")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantQuantity")}</TableHeaderCell>
                <TableHeaderCell>{t("colorantComments")}</TableHeaderCell>
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
                      <ColoranteLink
                        idColorante={row.idColorante}
                        codDocumento={row.codDocumento}
                      />
                    </TableCell>
                    <TableCell>{row.producto}</TableCell>
                    <TableCell>{formatDateByLanguage(row.fecha, i18n.language)}</TableCell>
                    <TableCell>{movimientoLabel(row.tipoMovimiento)}</TableCell>
                    <TableCell>{row.codBarco || ""}</TableCell>
                    <TableCell>{row.barco || ""}</TableCell>
                    <TableCell>{row.codSuplidor || ""}</TableCell>
                    <TableCell>{row.suplidor || ""}</TableCell>
                    <TableCell>{row.cantidad}</TableCell>
                    <TableCell>{row.comentarios || "-"}</TableCell>
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

export default ColoranteLogPage;
