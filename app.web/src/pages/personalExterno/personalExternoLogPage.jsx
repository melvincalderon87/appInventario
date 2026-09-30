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
import { PersonalExternoService } from "../../services/personalExternoService";
import {
  getPersonalExternoThemeStyles,
  usePersonalExternoStyles,
} from "../../styles/pages/personalExterno/personalExternoPageStyles";
import { assetUrl } from "../../utils/assets";
import { formatDateByLanguage } from "../../utils/formatDateByLanguage";
import { getAccionLogLabel } from "../../utils/accionLog";

const linkIconUrl = assetUrl("images/Link.svg");

function PersonalExternoLink({ idPersonalExterno, codPersonalExterno }) {
  const styles = usePersonalExternoStyles();

  if (!codPersonalExterno) return "";
  if (!idPersonalExterno) return codPersonalExterno;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/personalexterno/visualizar/${encodeURIComponent(idPersonalExterno)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{codPersonalExterno}</span>
    </span>
  );
}

function CompaniaInspeccionLink({ idCompaniaInspeccion, companiaInspeccion }) {
  const styles = usePersonalExternoStyles();

  if (!companiaInspeccion) return "";
  if (!idCompaniaInspeccion) return companiaInspeccion;

  return (
    <span className={styles.masterCell}>
      <Link
        className={styles.masterArrowLink}
        to={`/companiainspeccion/visualizar/${encodeURIComponent(idCompaniaInspeccion)}`}
      >
        <img className={styles.masterArrowImage} src={linkIconUrl} alt="" />
      </Link>
      <span>{companiaInspeccion}</span>
    </span>
  );
}

function UsuarioLink({ idUsuario, codUsuario }) {
  const styles = usePersonalExternoStyles();

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

function PersonalExternoLogPage() {
  const styles = usePersonalExternoStyles();
  const themeStyles = getPersonalExternoThemeStyles();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { idPersonalExterno = "" } = useParams();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    PersonalExternoService.log(idPersonalExterno)
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

        setError(loadError.message || t("externalStaffLogLoadError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [idPersonalExterno, navigate, t]);

  const back = () => {
    const companyId = log[0]?.idCompaniaInspeccion;
    navigate(
      companyId
        ? `/personalexterno/listar/${encodeURIComponent(companyId)}`
        : "/personalexterno/listar"
    );
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("externalStaffLogTitle")}</Title2>
          <Text className={styles.subtitle}>
            {t("externalStaffListCount", { count: log.length })}
          </Text>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}

      <div className={styles.tableSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingLog")} />
          </div>
        ) : (
          <Table aria-label={t("externalStaffLogTitle")} className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("version")}</TableHeaderCell>
                <TableHeaderCell>{t("actionLog")}</TableHeaderCell>
                <TableHeaderCell>{t("externalStaffCode")}</TableHeaderCell>
                <TableHeaderCell>{t("externalStaffCompany")}</TableHeaderCell>
                <TableHeaderCell>{t("externalStaffTechnicianCode")}</TableHeaderCell>
                <TableHeaderCell>{t("externalStaffName")}</TableHeaderCell>
                <TableHeaderCell>{t("externalStaffPosition")}</TableHeaderCell>
                <TableHeaderCell>{t("externalStaffIsTechnician")}</TableHeaderCell>
                <TableHeaderCell>{t("status")}</TableHeaderCell>
                <TableHeaderCell>{t("externalStaffPhoto")}</TableHeaderCell>
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
                      <PersonalExternoLink
                        idPersonalExterno={row.idPersonalExterno}
                        codPersonalExterno={row.codPersonalExterno}
                      />
                    </TableCell>
                    <TableCell>
                      <CompaniaInspeccionLink
                        idCompaniaInspeccion={row.idCompaniaInspeccion}
                        companiaInspeccion={row.companiaInspeccion}
                      />
                    </TableCell>
                    <TableCell>{row.codTecnico}</TableCell>
                    <TableCell>{row.nombre}</TableCell>
                    <TableCell>{row.puesto}</TableCell>
                    <TableCell>{t(row.esTecnico ? "yes" : "no")}</TableCell>
                    <TableCell>{t(row.estatus ? "active" : "inactive")}</TableCell>
                    <TableCell>{row.fotoNombreArchivo || "-"}</TableCell>
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
                  <TableCell colSpan={16}>
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

export default PersonalExternoLogPage;
