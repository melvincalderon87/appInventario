import { useEffect, useMemo, useState } from "react";
import { Checkbox, MessageBar, Spinner, Text, Title2 } from "@/components/ui/app-shadcn";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { UsuarioService } from "../../services/usuarioService";
import { UsuarioSuplidorService } from "../../services/usuarioSuplidorService";
import {
  getUsuarioConfiguracionThemeStyles,
  useUsuarioConfiguracionStyles,
} from "../../styles/pages/usuarioConfiguracion/usuarioConfiguracionPageStyles";

function UsuarioSuplidorListPage() {
  const styles = useUsuarioConfiguracionStyles();
  const themeStyles = getUsuarioConfiguracionThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idUsuario = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [usuario, setUsuario] = useState(null);
  const [suplidores, setSuplidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const returnTo = useMemo(() => {
    const value = searchParams.get("returnTo");
    if (!value) return "/usuario/listar";
    try {
      return decodeURIComponent(value) || "/usuario/listar";
    } catch {
      return value;
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function cargar() {
      try {
        setLoading(true);
        const [usuarioData, suplidoresData] = await Promise.all([
          UsuarioService.obtener(idUsuario),
          UsuarioSuplidorService.listar(idUsuario),
        ]);
        if (!active) return;
        setUsuario(usuarioData);
        setSuplidores(Array.isArray(suplidoresData) ? suplidoresData : []);
      } catch (cause) {
        if (active) setError(cause.message || t("userSupplierLoadError"));
      } finally {
        if (active) setLoading(false);
      }
    }
    cargar();
    return () => {
      active = false;
    };
  }, [idUsuario, t]);

  const alternar = (codSuplidor) => (_, data) => {
    setSuplidores((actual) =>
      actual.map((item) =>
        item.codSuplidor === codSuplidor ? { ...item, seleccionado: data.checked === true } : item
      )
    );
  };

  const guardar = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const codSuplidores = suplidores
        .filter((item) => item.seleccionado)
        .map((item) => item.codSuplidor);
      await UsuarioSuplidorService.guardar(idUsuario, codSuplidores);
      setMessage(t("userSupplierSaved"));
    } catch (cause) {
      setError(cause.message || t("userSupplierSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t("userSupplierTitle")}</Title2>
          <Text className={styles.subtitle}>{usuario?.nombre || usuario?.codUsuario || ""}</Text>
        </div>
        <ListActionButton
          action="regresar"
          label={t("back")}
          text={t("back")}
          onClick={() => navigate(returnTo)}
        />
      </div>
      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}
      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingUserSuppliers")} />
          </div>
        ) : (
          <>
            <Text className={styles.subtitle}>{t("userSupplierDescription")}</Text>
            <div className={styles.cardGrid} style={{ marginTop: "16px" }}>
              {suplidores.map((suplidor) => (
                <article
                  key={suplidor.codSuplidor}
                  className={styles.userCard}
                  style={themeStyles.surface}
                >
                  <Text weight="semibold" className={styles.userCode}>
                    {suplidor.suplidor}
                  </Text>
                  <Text className={styles.metaLabel}>{suplidor.codSuplidor}</Text>
                  <Checkbox
                    checked={suplidor.seleccionado === true}
                    onChange={alternar(suplidor.codSuplidor)}
                    label={t("userSupplierAllowView")}
                  />
                </article>
              ))}
            </div>
            {suplidores.length === 0 ? (
              <Text className={styles.empty}>{t("noSuppliersFound")}</Text>
            ) : null}
            <div className={styles.buttonRow}>
              <ListActionButton
                action="editar"
                label={t("save")}
                text={saving ? t("saving") : t("save")}
                disabled={saving}
                onClick={guardar}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default UsuarioSuplidorListPage;
