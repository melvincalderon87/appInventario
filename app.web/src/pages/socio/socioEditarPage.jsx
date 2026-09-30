import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Field,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Button,
  Input,
  MessageBar,
  Select,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title2,
} from "@/components/ui/app-shadcn";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { SuplidorService } from "../../services/suplidorService";
import { SocioService } from "../../services/socioService";
import { ProductoService } from "../../services/productoService";
import {
  getSocioActionPageThemeStyles,
  useSocioActionPageStyles,
} from "../../styles/pages/socio/socioActionPageStyles";

const EMPTY_SOCIO = {
  idSuplidor: "",
  codSuplidor: "",
  codSocio: "",
  socio: "",
  suplidor: "",
  suplidorNombreCorto: "",
  estatus: true,
};

function SocioEditarPage() {
  const styles = useSocioActionPageStyles();
  const themeStyles = getSocioActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idSuplidor = "" } = useParams();
  const { values: socio, setValues: setSocio } = useFormStateAdapter(EMPTY_SOCIO);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [productosDistribucion, setProductosDistribucion] = useState([]);
  const [detallesDistribucion, setDetallesDistribucion] = useState([]);
  const [savingDistribucion, setSavingDistribucion] = useState(false);
  const [productoLookupIndex, setProductoLookupIndex] = useState(null);
  const [productoSearch, setProductoSearch] = useState("");

  const isAdd = false;
  const isView = false;
  const isEdit = true;
  const isDelete = false;
  const canEditFields = isAdd || isEdit;
  const sociosOptions = [...socios];
  if (
    socio.codSocio &&
    !sociosOptions.some((option) => String(option.value) === String(socio.codSocio))
  ) {
    sociosOptions.push({
      value: String(socio.codSocio),
      text: socio.socio || String(socio.codSocio),
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const data = await SocioService.ListarOpcion();
        if (isMounted) setSocios(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setSocios([]);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadSocio() {
      try {
        setLoading(true);
        setError("");
        const data = await SuplidorService.obtener(idSuplidor);
        if (isMounted) setSocio(data);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("partnerLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSocio();

    return () => {
      isMounted = false;
    };
  }, [idSuplidor, isAdd, setSocio, t]);

  useEffect(() => {
    let active = true;
    Promise.all([ProductoService.ListarOpcion(), SuplidorService.listarDistribucion(idSuplidor)])
      .then(([productos, detalles]) => {
        if (active) {
          setProductosDistribucion(productos || []);
          setDetallesDistribucion(detalles || []);
        }
      })
      .catch(() => {
        if (active) setDetallesDistribucion([]);
      });
    return () => {
      active = false;
    };
  }, [idSuplidor]);

  const updateField = (key) => (_, data) => {
    setSocio((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setSocio((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const back = () => navigate("/suplidor/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/suplidor/editar",
      codpermiso: PERMISOS.editar,
    });

    if (response.authenticated === false) {
      navigate("/");
      return;
    }

    if (!response.authorized) {
      navigate("/inicio");
      return;
    }

    navigate(`/suplidor/editar/${encodeURIComponent(idSuplidor)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.suplidor, socio, t, setError).ok) return;

      const payload = {
        ...socio,
        codSocio: String(socio.codSocio ?? "").trim(),
        estatus: socio.estatus !== false,
      };

      if (isAdd) {
        await SuplidorService.agregar(payload);
        setMessage(t("partnerAdded"));
        setSocio(EMPTY_SOCIO);
      }

      if (isEdit) {
        await SuplidorService.editar(payload);
        setMessage(t("partnerSaved"));
      }

      if (isDelete) {
        await SuplidorService.eliminar(payload);
        navigate("/suplidor/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("partnerSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const guardarDistribucion = async () => {
    try {
      setSavingDistribucion(true);
      setError("");
      setMessage("");
      await SuplidorService.guardarDistribucion(
        idSuplidor,
        detallesDistribucion.map((item) => ({
          codProducto: String(item.codProducto),
          porcentajeDistribucion: Number(item.porcentajeDistribucion),
        }))
      );
      setMessage("Distribución guardada correctamente.");
    } catch (saveError) {
      setError(saveError.message || "No fue posible guardar la distribución.");
    } finally {
      setSavingDistribucion(false);
    }
  };

  const productoSeleccionado = (codProducto) =>
    productosDistribucion.find((producto) => String(producto.value) === String(codProducto))
      ?.text || "";

  const abrirBuscadorProducto = (indice) => {
    setProductoSearch("");
    setProductoLookupIndex(indice);
  };

  const productosDisponibles = productosDistribucion.filter((producto) => {
    const texto = `${producto.value} ${producto.text}`.toLowerCase();
    const coincideBusqueda = texto.includes(productoSearch.trim().toLowerCase());
    const yaSeleccionado = detallesDistribucion.some(
      (detalle, indice) =>
        indice !== productoLookupIndex && String(detalle.codProducto) === String(producto.value)
    );
    return coincideBusqueda && !yaSeleccionado;
  });

  const titleKey = "partnerEditTitle";

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t(titleKey)}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        <div className={styles.tabs} role="tablist" aria-label="Detalle del suplidor">
          <button
            type="button"
            role="tab"
            className={styles.tabButton}
            aria-selected={activeTab === "general"}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            type="button"
            role="tab"
            className={styles.tabButton}
            aria-selected={activeTab === "distribucion"}
            onClick={() => setActiveTab("distribucion")}
          >
            Distribución de productos
          </button>
        </div>
        <div hidden={activeTab !== "general"}>
          {loading ? (
            <div className={styles.loading}>
              <Spinner label={t("loadingPartner")} />
            </div>
          ) : (
            <>
              {isDelete ? (
                <MessageBar intent="warning">
                  {t("deletePartnerConfirmation", {
                    partner: socio.suplidor,
                  })}
                </MessageBar>
              ) : null}

              <div className={styles.formGrid}>
                {!isAdd ? (
                  <Field label={t("partnerCode")}>
                    <Input value={String(socio.codSuplidor ?? "")} disabled />
                  </Field>
                ) : null}
                <Field label={t("partnerTypeName")} required={canEditFields}>
                  <Select
                    value={String(socio.codSocio || "")}
                    disabled={!canEditFields}
                    onChange={updateField("codSocio")}
                  >
                    <option value="">{t("selectOption")}</option>
                    {sociosOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.text}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("partnerDescription")} required={canEditFields}>
                  <Input
                    value={socio.suplidor ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("suplidor")}
                  />
                </Field>
                <Field label={t("partnerShortDescription")} required={canEditFields}>
                  <Input
                    maxLength={10}
                    value={socio.suplidorNombreCorto ?? ""}
                    disabled={!canEditFields}
                    onChange={updateField("suplidorNombreCorto")}
                  />
                </Field>
                <Field label={t("partnerStatus")}>
                  <Switch
                    checked={socio.estatus !== false}
                    disabled={!canEditFields}
                    label={socio.estatus !== false ? t("active") : t("inactive")}
                    onChange={updateBoolField("estatus")}
                  />
                </Field>
              </div>

              <div className={styles.buttonRow}>
                {isView ? (
                  <ListActionButton
                    action="editar"
                    label={t("edit")}
                    text={t("edit")}
                    onClick={goEdit}
                  />
                ) : null}
                {isAdd ? (
                  <ListActionButton
                    action="agregar"
                    label={t("add")}
                    text={saving ? t("saving") : t("add")}
                    disabled={saving}
                    onClick={save}
                  />
                ) : null}
                {isEdit ? (
                  <ListActionButton
                    action="editar"
                    label={t("save")}
                    text={saving ? t("saving") : t("save")}
                    disabled={saving}
                    onClick={save}
                  />
                ) : null}
                {isDelete ? (
                  <ListActionButton
                    action="eliminar"
                    label={t("confirmDelete")}
                    text={saving ? t("deleting") : t("confirmDelete")}
                    disabled={saving}
                    onClick={() => setOpenDeleteConfirm(true)}
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
        {activeTab === "distribucion" ? (
          <div>
            <ListActionButton
              action="agregar"
              label="Agregar producto"
              text="Agregar producto"
              onClick={() =>
                setDetallesDistribucion((rows) => [
                  ...rows,
                  { codProducto: "", porcentajeDistribucion: 0 },
                ])
              }
            />

            <div className={styles.distributionList} style={{ marginTop: "16px" }}>
              {detallesDistribucion.map((detalle, indice) => (
                <div className={styles.distributionRow} key={indice}>
                  <Field label="Producto">
                    <div className={styles.lookupField}>
                      <Input
                        value={productoSeleccionado(detalle.codProducto)}
                        readOnly
                        placeholder="Seleccione un producto"
                        onClick={() => abrirBuscadorProducto(indice)}
                      />
                      <Button
                        appearance="secondary"
                        icon={<Search />}
                        onClick={() => abrirBuscadorProducto(indice)}
                      >
                        Buscar
                      </Button>
                    </div>
                  </Field>
                  <Field label="% Distribución">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.0001"
                      value={String(detalle.porcentajeDistribucion ?? 0)}
                      onChange={(_, data) =>
                        setDetallesDistribucion((rows) =>
                          rows.map((row, i) =>
                            i === indice ? { ...row, porcentajeDistribucion: data.value } : row
                          )
                        )
                      }
                    />
                  </Field>
                  <ListActionButton
                    action="eliminar"
                    label="Quitar"
                    text="Quitar"
                    onClick={() =>
                      setDetallesDistribucion((rows) => rows.filter((_, i) => i !== indice))
                    }
                  />
                </div>
              ))}
            </div>

            <div className={styles.buttonRow}>
              <ListActionButton
                action="editar"
                label="Guardar"
                text={savingDistribucion ? "Guardando..." : "Guardar"}
                disabled={savingDistribucion}
                onClick={guardarDistribucion}
              />
            </div>
          </div>
        ) : null}
      </div>

      <Dialog
        open={productoLookupIndex !== null}
        onOpenChange={(_, data) => !data.open && setProductoLookupIndex(null)}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>Buscar producto</DialogTitle>
            <DialogContent className={styles.lookupDialogContent}>
              <Input
                value={productoSearch}
                contentBefore={<Search />}
                placeholder="Escriba código o nombre del producto"
                onChange={(_, data) => setProductoSearch(data.value)}
              />
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Código</TableHeaderCell>
                      <TableHeaderCell>Producto</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        Acciones
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosDisponibles.length ? (
                      productosDisponibles.map((producto) => (
                        <TableRow
                          key={producto.value}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => {
                            setDetallesDistribucion((rows) =>
                              rows.map((row, indice) =>
                                indice === productoLookupIndex
                                  ? { ...row, codProducto: producto.value }
                                  : row
                              )
                            );
                            setProductoLookupIndex(null);
                          }}
                        >
                          <TableCell>{producto.value}</TableCell>
                          <TableCell>{producto.text}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => {
                                setDetallesDistribucion((rows) =>
                                  rows.map((row, indice) =>
                                    indice === productoLookupIndex
                                      ? { ...row, codProducto: producto.value }
                                      : row
                                  )
                                );
                                setProductoLookupIndex(null);
                              }}
                            >
                              Seleccionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          No hay productos disponibles.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label="Cerrar"
                text="Cerrar"
                onClick={() => setProductoLookupIndex(null)}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>
              {t("deletePartnerConfirmation", {
                partner: socio.suplidor,
              })}
            </DialogContent>
            <DialogActions>
              <ListActionButton
                action="regresar"
                label={t("back")}
                text={t("back")}
                onClick={() => setOpenDeleteConfirm(false)}
              />
              <ListActionButton
                action="eliminar"
                label={t("confirmDelete")}
                text={saving ? t("deleting") : t("confirmDelete")}
                disabled={saving}
                onClick={confirmDelete}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default SocioEditarPage;
