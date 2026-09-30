import { useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import { useMemo } from "react";
import {
  Button,
  Field,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  MessageBar,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Textarea,
  Title2,
} from "@/components/ui/app-shadcn";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { BarcoService } from "../../services/barcoService";
import { SuplidorService } from "../../services/suplidorService";
import {
  getBarcoActionPageThemeStyles,
  useBarcoActionPageStyles,
} from "../../styles/pages/barco/barcoActionPageStyles";

const createEmptyDetalle = () => ({
  clientId: crypto.randomUUID(),
  linea: 0,
  codSuplidor: 0,
  codProducto: 0,
  cantidad: 0,
});

const EMPTY_BARCO = {
  idBarco: "",
  codBarco: 0,
  barco: "",
  fechaPrevista: "",
  comentario: "",
  detalles: [createEmptyDetalle()],
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function optionValue(option) {
  return String(option?.value ?? option?.Value ?? "");
}

function optionText(option) {
  return String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
}

function getSelectedOptionText(options, value) {
  const selected = options.find((option) => optionValue(option) === String(value ?? ""));
  return selected ? optionText(selected) : "";
}

function filterLookupOptions(options, search) {
  const searchText = String(search ?? "")
    .trim()
    .toLowerCase();
  if (!searchText) return options;

  return options.filter((option) =>
    `${optionValue(option)} ${optionText(option)}`.toLowerCase().includes(searchText)
  );
}

function normalizeBarco(data) {
  const detalles =
    Array.isArray(data?.detalles) && data.detalles.length > 0
      ? data.detalles.map((detalle) => ({
          ...detalle,
          clientId: crypto.randomUUID(),
          codSuplidor: toNumber(detalle.codSuplidor),
          codProducto: toNumber(detalle.codProducto),
          cantidad: toNumber(detalle.cantidad),
        }))
      : [createEmptyDetalle()];

  return {
    ...EMPTY_BARCO,
    ...data,
    fechaPrevista: toDateInputValue(data?.fechaPrevista),
    detalles,
  };
}

function buildPayload(barco) {
  return {
    idBarco: barco.idBarco,
    codBarco: toNumber(barco.codBarco),
    barco: barco.barco,
    fechaPrevista: barco.fechaPrevista,
    comentario: String(barco.comentario ?? "").trim(),
    detalles: barco.detalles.map((detalle, index) => ({
      linea: index + 1,
      codSuplidor: toNumber(detalle.codSuplidor),
      codProducto: toNumber(detalle.codProducto),
      cantidad: toNumber(detalle.cantidad),
    })),
  };
}

function BarcoFormPage({ mode }) {
  const styles = useBarcoActionPageStyles();
  const themeStyles = getBarcoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idBarco = "" } = useParams();
  const { values: barco, setValues: setBarco } = useFormStateAdapter(EMPTY_BARCO);
  const [socios, setSocios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(mode !== "agregar");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "agregar";
  const isView = mode === "visualizar";
  const isEdit = mode === "editar";
  const isDelete = mode === "eliminar";
  const canEditFields = isAdd || isEdit;
  const lookupOptions = useMemo(() => {
    if (lookup?.type === "suplidor") return socios;
    if (lookup?.type === "producto") return productos;
    return [];
  }, [lookup?.type, productos, socios]);
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");
        const [sociosData, productosData] = await Promise.all([
          SuplidorService.ListarOpcion(),
          BarcoService.ListarProductoCombustibleOpcion(),
        ]);

        if (isMounted) {
          setSocios(Array.isArray(sociosData) ? sociosData : []);
          setProductos(Array.isArray(productosData) ? productosData : []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("shipOptionsLoadError"));
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    if (isAdd) {
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadBarco() {
      try {
        setLoading(true);
        setError("");
        const data = await BarcoService.obtener(idBarco);
        if (isMounted) setBarco(normalizeBarco(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("shipLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBarco();

    return () => {
      isMounted = false;
    };
  }, [idBarco, isAdd, setBarco, t]);

  const updateField = (key) => (_, data) => {
    setBarco((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateDetalle = (clientId, key) => (_, data) => {
    const value = key === "cantidad" ? toNumber(data.value) : toNumber(data.value);

    setBarco((current) => ({
      ...current,
      detalles: current.detalles.map((detalle) =>
        detalle.clientId === clientId ? { ...detalle, [key]: value } : detalle
      ),
    }));
  };

  const openLookupDialog = (clientId, type) => {
    if (!canEditFields) return;
    setLookupSearch("");
    setLookup({ clientId, type });
  };

  const closeLookupDialog = () => {
    setLookup(null);
    setLookupSearch("");
  };

  const selectLookupOption = (option) => {
    if (!lookup) return;

    const key = lookup.type === "suplidor" ? "codSuplidor" : "codProducto";
    const value = toNumber(optionValue(option));
    setBarco((current) => ({
      ...current,
      detalles: current.detalles.map((detalle) =>
        detalle.clientId === lookup.clientId ? { ...detalle, [key]: value } : detalle
      ),
    }));
    closeLookupDialog();
  };

  const addDetalle = () => {
    setBarco((current) => ({
      ...current,
      detalles: [...current.detalles, createEmptyDetalle()],
    }));
  };

  const removeDetalle = (clientId) => {
    setBarco((current) => {
      const detalles = current.detalles.filter((detalle) => detalle.clientId !== clientId);
      return {
        ...current,
        detalles: detalles.length > 0 ? detalles : [createEmptyDetalle()],
      };
    });
  };

  const back = () => navigate("/barco/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/barco/editar",
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

    navigate(`/barco/editar/${encodeURIComponent(idBarco)}`);
  };

  const validate = () => setZodValidationError(formSchemas.barco, barco, t, setError).ok;

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (isDelete) {
        await BarcoService.eliminar(barco);
        navigate("/barco/listar");
        return;
      }

      if (!validate()) return;

      const payload = buildPayload(barco);

      if (isAdd) {
        await BarcoService.agregar(payload);
        setMessage(t("shipAdded"));
        setBarco({
          ...EMPTY_BARCO,
          detalles: [createEmptyDetalle()],
        });
      }

      if (isEdit) {
        await BarcoService.editar(payload);
        setMessage(t("shipSaved"));
      }
    } catch (saveError) {
      setError(saveError.message || t("shipSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKey = {
    agregar: "shipAddTitle",
    visualizar: "shipViewTitle",
    editar: "shipEditTitle",
    eliminar: "shipDeleteTitle",
  }[mode];

  const isBusy = loading || loadingOptions;

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
        {isBusy ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingShip")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteShipConfirmation", {
                  ship: barco.barco,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("shipCode")}>
                  <Input value={String(barco.codBarco ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("shipName")} required={canEditFields}>
                <Input
                  value={barco.barco ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("barco")}
                />
              </Field>
              <Field label={t("shipExpectedDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={barco.fechaPrevista ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("fechaPrevista")}
                />
              </Field>
              <Field label={t("shipComment")} className={styles.fullWidthField}>
                <Textarea
                  value={barco.comentario ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("comentario")}
                />
              </Field>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.detailHeader}>
                <Text weight="semibold" className={styles.detailTitle}>
                  {t("shipDetailTitle")}
                </Text>
                {canEditFields ? (
                  <ListActionButton
                    action="agregar"
                    label={t("shipAddRow")}
                    text={t("shipAddRow")}
                    onClick={addDetalle}
                  />
                ) : null}
              </div>

              <div className={styles.detailRows}>
                {barco.detalles.map((detalle, index) => (
                  <div
                    key={detalle.clientId}
                    className={styles.detailRow}
                    style={themeStyles.detailRow}
                  >
                    <Field label={t("shipDetailPartner")} required={canEditFields}>
                      <div className={styles.lookupControl}>
                        <Input
                          value={getSelectedOptionText(socios, detalle.codSuplidor)}
                          readOnly
                          placeholder={t("selectOption")}
                        />
                        <Button
                          size="small"
                          appearance="secondary"
                          icon={<Search />}
                          disabled={!canEditFields}
                          onClick={() => openLookupDialog(detalle.clientId, "suplidor")}
                        >
                          {t("shipLookupSearch")}
                        </Button>
                      </div>
                    </Field>
                    <Field label={t("shipDetailProduct")} required={canEditFields}>
                      <div className={styles.lookupControl}>
                        <Input
                          value={getSelectedOptionText(productos, detalle.codProducto)}
                          readOnly
                          placeholder={t("selectOption")}
                        />
                        <Button
                          size="small"
                          appearance="secondary"
                          icon={<Search />}
                          disabled={!canEditFields}
                          onClick={() => openLookupDialog(detalle.clientId, "producto")}
                        >
                          {t("shipLookupSearch")}
                        </Button>
                      </div>
                    </Field>
                    <Field label={t("shipDetailQuantity")} required={canEditFields}>
                      <Input
                        type="number"
                        value={String(detalle.cantidad ?? 0)}
                        disabled={!canEditFields}
                        onChange={updateDetalle(detalle.clientId, "cantidad")}
                      />
                    </Field>
                    <div className={styles.detailActions}>
                      {canEditFields ? (
                        <ListActionButton
                          action="eliminar"
                          label={t("delete")}
                          disabled={barco.detalles.length === 1 && index === 0}
                          onClick={() => removeDetalle(detalle.clientId)}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
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

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>
              {t("deleteShipConfirmation", {
                ship: barco.barco,
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

      <Dialog open={Boolean(lookup)} onOpenChange={(_, data) => !data.open && closeLookupDialog()}>
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>
              {lookup?.type === "suplidor"
                ? t("shipPartnerSearchTitle")
                : t("shipProductSearchTitle")}
            </DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  placeholder={t("shipLookupSearchPlaceholder")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("shipLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("shipLookupName")}</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLookupOptions.length > 0 ? (
                      filteredLookupOptions.map((option) => (
                        <TableRow
                          key={optionValue(option)}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => selectLookupOption(option)}
                        >
                          <TableCell>{optionValue(option)}</TableCell>
                          <TableCell>{optionText(option)}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectLookupOption(option)}
                            >
                              {t("shipLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{t("shipLookupEmpty")}</Text>
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
                label={t("back")}
                text={t("back")}
                onClick={closeLookupDialog}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default BarcoFormPage;
