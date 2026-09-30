import { useEffect, useMemo, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  Select,
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
import { useTranslation } from "react-i18next";
import { Check, Search } from "lucide-react";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { AditivoService } from "../../services/aditivoService";
import { SuplidorService } from "../../services/suplidorService";
import { TanqueService } from "../../services/tanqueService";
import {
  getAditivoActionPageThemeStyles,
  useAditivoActionPageStyles,
} from "../../styles/pages/aditivo/aditivoActionPageStyles";

const EMPTY_ADITIVO = {
  idAditivo: "",
  codDocumento: 0,
  codSuplidor: 0,
  codProducto: 0,
  producto: "",
  codTanque: "",
  tanque: "",
  fecha: "",
  tipoMovimiento: "INGRESO",
  cantidad: 0,
  comentario: "",
  estatus: true,
};

const ADDITIVE_FILTER = {
  tipoProducto: "Aditivo",
};

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toText(value) {
  return String(value ?? "").trim();
}

function optionValue(option) {
  return String(option?.value ?? option?.Value ?? "");
}

function optionText(option) {
  return String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
}

function getSelectedOptionText(options, value, fallback = "") {
  const selectedValue = String(value ?? "");
  if (!selectedValue || selectedValue === "0") return "";

  const selectedOption = options.find((option) => optionValue(option) === selectedValue);
  return optionText(selectedOption) || String(fallback ?? selectedValue);
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

function normalizeMovement(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase() === "SALIDA"
    ? "SALIDA"
    : "INGRESO";
}

function getFormPayload(aditivo, movementType, includeId = false) {
  const payload = {
    ...aditivo,
    codDocumento: includeId ? toNumber(aditivo.codDocumento) : 0,
    codSuplidor: toNumber(aditivo.codSuplidor),
    codProducto: toNumber(aditivo.codProducto),
    codTanque: toText(aditivo.codTanque),
    fecha: toText(aditivo.fecha),
    tipoMovimiento: movementType,
    cantidad: Math.abs(toNumber(aditivo.cantidad)),
    comentario: toText(aditivo.comentario),
  };

  return payload;
}

function AditivoFormPage({ mode }) {
  const styles = useAditivoActionPageStyles();
  const themeStyles = getAditivoActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idAditivo = "" } = useParams();
  const { values: aditivo, setValues: setAditivo } = useFormStateAdapter({
    ...EMPTY_ADITIVO,
  });

  const isIngreso = mode === "INGRESO";
  const isSalida = mode === "SALIDA";
  const isView = mode === "visualizar";
  const isEdit = mode === "editar";
  const isDelete = mode === "eliminar";
  const isAdd = isIngreso || isSalida;
  const canEditFields = isAdd || isEdit;
  const canLoadCatalogs = isAdd || isEdit;
  const movementType = normalizeMovement(isAdd ? mode : aditivo.tipoMovimiento);
  const showIngresoFields = movementType !== "SALIDA";
  const titleByMode = {
    INGRESO: "additiveEntryTitle",
    SALIDA: "additiveExitTitle",
    visualizar: "additiveViewTitle",
    editar: "additiveEditTitle",
    eliminar: "additiveDeleteTitle",
  };

  const [socios, setSocios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tanques, setTanques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isProductLookup = lookupType === "producto";
  const isSupplierLookup = lookupType === "suplidor";
  const lookupOptions = isProductLookup ? productos : isSupplierLookup ? socios : tanques;
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );
  const selectedSupplierLabel = getSelectedOptionText(
    socios,
    aditivo.codSuplidor,
    aditivo.suplidor
  );
  const selectedProductLabel = getSelectedOptionText(
    productos,
    aditivo.codProducto,
    aditivo.producto
  );
  const selectedTankLabel = getSelectedOptionText(tanques, aditivo.codTanque, aditivo.tanque);
  const lookupTitle = isProductLookup
    ? t("additiveProductSearchTitle")
    : isSupplierLookup
      ? t("additiveSupplierSearchTitle")
      : t("additiveTankSearchTitle");
  const lookupSearchPlaceholder = isProductLookup
    ? t("additiveSearchProduct")
    : isSupplierLookup
      ? t("additiveSearchSupplier")
      : t("additiveSearchTank");
  const lookupEmptyMessage = isProductLookup
    ? t("additiveNoProductsFound")
    : isSupplierLookup
      ? t("additiveNoSuppliersFound")
      : t("additiveNoTanksFound");

  useEffect(() => {
    if (!canLoadCatalogs) return undefined;

    let isMounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");
        const [suplidoresData, productosData, tanquesData] = await Promise.all([
          SuplidorService.ListarOpcion(),
          AditivoService.ListarProductoOpcion(),
          TanqueService.ListarOpcion(ADDITIVE_FILTER),
        ]);

        if (isMounted) {
          setSocios(Array.isArray(suplidoresData) ? suplidoresData : []);
          setProductos(Array.isArray(productosData) ? productosData : []);
          setTanques(Array.isArray(tanquesData) ? tanquesData : []);
        }
      } catch (optionError) {
        if (isMounted) {
          setError(optionError.message || t("additiveOptionsLoadError"));
        }
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [canLoadCatalogs, t]);

  useEffect(() => {
    if (!isAdd) return undefined;

    setAditivo({
      ...EMPTY_ADITIVO,
      tipoMovimiento: isSalida ? "SALIDA" : "INGRESO",
    });

    return undefined;
  }, [isAdd, isSalida, setAditivo]);

  useEffect(() => {
    if (isAdd) return undefined;

    let isMounted = true;

    async function loadAditivo() {
      try {
        setLoading(true);
        setError("");
        const data = await AditivoService.obtener(idAditivo);

        if (!isMounted) return;

        const movement = normalizeMovement(data.tipoMovimiento);

        setAditivo({
          ...EMPTY_ADITIVO,
          ...data,
          codDocumento: toNumber(data?.codDocumento),
          fecha: toDateInputValue(data.fecha),
          tipoMovimiento: movement,
        });
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || t("additiveLoadError"));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAditivo();

    return () => {
      isMounted = false;
    };
  }, [idAditivo, isAdd, setAditivo, t]);

  const updateTextField = (key) => (_, data) => {
    setAditivo((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setAditivo((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const openLookupDialog = (type) => {
    if (!canEditFields) return;

    setLookupSearch("");
    setLookupType(type);
  };

  const closeLookupDialog = () => {
    setLookupType("");
    setLookupSearch("");
  };

  const selectLookupOption = (option) => {
    const value = optionValue(option);
    const text = optionText(option);

    setAditivo((current) => {
      if (isProductLookup) {
        return {
          ...current,
          codProducto: toNumber(value),
          producto: text,
        };
      }

      if (isSupplierLookup) {
        return {
          ...current,
          codSuplidor: toNumber(value),
          suplidor: text,
        };
      }

      return {
        ...current,
        codTanque: value,
        tanque: text,
      };
    });

    closeLookupDialog();
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const schema =
        movementType === "SALIDA" ? formSchemas.aditivoSalida : formSchemas.aditivoEntrada;

      if (!setZodValidationError(schema, aditivo, t, setError).ok) return;

      const payload = getFormPayload(aditivo, movementType, !isAdd);

      if (isAdd) {
        await AditivoService.agregar(payload);
        setMessage(movementType === "SALIDA" ? t("additiveExitAdded") : t("additiveEntryAdded"));
        setAditivo({
          ...EMPTY_ADITIVO,
          tipoMovimiento: movementType,
        });
        return;
      }

      if (isEdit) {
        await AditivoService.editar(payload);
        setMessage(t("additiveSaved"));
        return;
      }

      if (isDelete) {
        await AditivoService.eliminar(payload);
        setMessage(t("additiveDeleted"));
        navigate(movementType === "SALIDA" ? "/aditivo/salida/listar" : "/aditivo/ingreso/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("additiveSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const back = () =>
    navigate(movementType === "SALIDA" ? "/aditivo/salida/listar" : "/aditivo/ingreso/listar");
  const title = titleByMode[mode] || "additiveEntryTitle";

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t(title)}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading || loadingOptions ? (
          <div className={styles.loading}>
            <Spinner label={loading ? t("loadingAdditives") : t("loadingAdditiveOptions")} />
          </div>
        ) : (
          <>
            {isView ? (
              <MessageBar intent="info">
                {t("additiveViewInfo", {
                  movement: t(
                    aditivo.tipoMovimiento === "SALIDA"
                      ? "additiveMovementOut"
                      : "additiveMovementIn"
                  ),
                })}
              </MessageBar>
            ) : null}

            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteAdditiveConfirmation", {
                  movement: t(
                    aditivo.tipoMovimiento === "SALIDA"
                      ? "additiveMovementOut"
                      : "additiveMovementIn"
                  ),
                  code: aditivo.codDocumento,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("additiveCode")}>
                  <Input value={String(aditivo.codDocumento || "")} disabled />
                </Field>
              ) : null}

              <Field label={t("additiveDate")} required={canEditFields && showIngresoFields}>
                <LocalizedDateInput
                  value={toDateInputValue(aditivo.fecha)}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>

              <Field label={t("additivePartner")} required={canEditFields && showIngresoFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedSupplierLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("suplidor")}
                  >
                    {t("additiveLookupSearch")}
                  </Button>
                </div>
              </Field>

              <Field label={t("additiveProduct")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedProductLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("producto")}
                  >
                    {t("additiveLookupSearch")}
                  </Button>
                </div>
              </Field>

              <Field label={t("additiveTank")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedTankLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("tanque")}
                  >
                    {t("additiveLookupSearch")}
                  </Button>
                </div>
              </Field>

              <Field label={t("additiveQuantityGallons")} required={canEditFields}>
                <Input
                  type="number"
                  min={0}
                  value={String(Math.abs(toNumber(aditivo.cantidad || 0)))}
                  disabled={!canEditFields}
                  onChange={updateNumberField("cantidad")}
                />
              </Field>

              <Field label={t("additiveComment")}>
                <Textarea
                  maxLength={250}
                  value={aditivo.comentario ?? ""}
                  disabled={!canEditFields}
                  onChange={updateTextField("comentario")}
                  rows={3}
                />
              </Field>
            </div>

            <div className={styles.buttonRow}>
              {isView ? (
                <ListActionButton
                  action="editar"
                  label={t("edit")}
                  text={t("edit")}
                  onClick={() =>
                    navigate(`/aditivo/editar/${encodeURIComponent(aditivo.idAditivo)}`)
                  }
                />
              ) : null}
              {isAdd ? (
                <ListActionButton
                  action={isSalida ? "salida" : "ingreso"}
                  label={t("save")}
                  text={saving ? t("saving") : t("save")}
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
              {t("deleteAdditiveConfirmation", {
                movement: t(
                  aditivo.tipoMovimiento === "SALIDA" ? "additiveMovementOut" : "additiveMovementIn"
                ),
                code: aditivo.codDocumento,
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

      <Dialog
        open={Boolean(lookupType)}
        onOpenChange={(_, data) => {
          if (!data.open) closeLookupDialog();
        }}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>{lookupTitle}</DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  placeholder={lookupSearchPlaceholder}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("additiveLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("additiveLookupName")}</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLookupOptions.length > 0 ? (
                      filteredLookupOptions.map((option) => (
                        <TableRow
                          key={`${lookupType}-${optionValue(option)}-${optionText(option)}`}
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
                              {t("additiveLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{lookupEmptyMessage}</Text>
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

export default AditivoFormPage;
