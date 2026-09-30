import { useCallback, useEffect, useState } from "react";
import { useFormStateAdapter } from "../../hooks/useFormStateAdapter";
import { useMemo } from "react";
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
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { SuplidorService } from "../../services/suplidorService";
import { CompraVentaSuplidoresService } from "../../services/compraVentaSuplidoresService";
import {
  getCompraVentaSuplidoresActionPageThemeStyles,
  useCompraVentaSuplidoresActionPageStyles,
} from "../../styles/pages/compraVentaSuplidores/compraVentaSuplidoresActionPageStyles";

const EMPTY_TRASLADO = {
  idCompraVentaSuplidores: "",
  codCompraVentaSuplidores: 0,
  fecha: "",
  codSuplidorOrigen: 0,
  codSuplidorDestino: 0,
  codProducto: 0,
  cantidadEstandar: 0,
  cantidadAmbiente: 0,
  estatus: true,
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
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
  return searchText
    ? options.filter((option) =>
        `${optionValue(option)} ${optionText(option)}`.toLowerCase().includes(searchText)
      )
    : options;
}

function buildPayload(traslado) {
  return {
    ...traslado,
    codCompraVentaSuplidores: toNumber(traslado.codCompraVentaSuplidores),
    codSuplidorOrigen: toNumber(traslado.codSuplidorOrigen),
    codSuplidorDestino: toNumber(traslado.codSuplidorDestino),
    codProducto: toNumber(traslado.codProducto),
    cantidadEstandar: toNumber(traslado.cantidadEstandar),
    cantidadAmbiente: toNumber(traslado.cantidadAmbiente),
    estatus: traslado.estatus !== false,
  };
}

function CompraVentaSuplidoresFormPage({ mode }) {
  const styles = useCompraVentaSuplidoresActionPageStyles();
  const themeStyles = getCompraVentaSuplidoresActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idCompraVentaSuplidores = "" } = useParams();
  const { values: traslado, setValues: setTraslado } = useFormStateAdapter(EMPTY_TRASLADO);
  const [socios, setSocios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const lookupOptions = useMemo(
    () => (lookupType === "producto" ? productos : socios),
    [lookupType, productos, socios]
  );
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );

  const loadNextCode = useCallback(async () => {
    const data = await CompraVentaSuplidoresService.obtenerKey();
    const nextCode = toNumber(data?.codCompraVentaSuplidores ?? data?.CodCompraVentaSuplidores);

    setTraslado((current) => ({
      ...current,
      codCompraVentaSuplidores: nextCode,
    }));
  }, [setTraslado]);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        setError("");
        const [sociosData, productosData] = await Promise.all([
          SuplidorService.ListarOpcion(),
          CompraVentaSuplidoresService.listarProductoCombustibleOpcion(),
        ]);

        if (isMounted) {
          setSocios(Array.isArray(sociosData) ? sociosData : []);
          setProductos(Array.isArray(productosData) ? productosData : []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("productTransferOptionsLoadError"));
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    async function loadTraslado() {
      try {
        setLoading(true);
        setError("");

        if (isAdd) {
          setTraslado(EMPTY_TRASLADO);
          await loadNextCode();
          return;
        }

        const data = await CompraVentaSuplidoresService.obtener(idCompraVentaSuplidores);
        if (isMounted) setTraslado({ ...EMPTY_TRASLADO, ...data });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("productTransferLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTraslado();

    return () => {
      isMounted = false;
    };
  }, [idCompraVentaSuplidores, isAdd, loadNextCode, setTraslado, t]);

  const updateTextField = (key) => (_, data) => {
    setTraslado((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setTraslado((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setTraslado((current) => ({
      ...current,
      [key]: Boolean(data.checked),
    }));
  };

  const openLookupDialog = (type) => {
    if (canEditFields) {
      setLookupSearch("");
      setLookupType(type);
    }
  };
  const closeLookupDialog = () => {
    setLookupType("");
    setLookupSearch("");
  };
  const selectLookupOption = (option) => {
    const key = {
      origen: "codSuplidorOrigen",
      destino: "codSuplidorDestino",
      producto: "codProducto",
    }[lookupType];
    setTraslado((current) => ({ ...current, [key]: toNumber(optionValue(option)) }));
    closeLookupDialog();
  };

  const back = () => navigate("/compraventasuplidores/listar");

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.compraVentaSuplidores, traslado, t, setError).ok)
        return;

      const payload = buildPayload(traslado);

      if (isAdd) {
        await CompraVentaSuplidoresService.agregar(payload);
        setMessage(t("productTransferAdded"));
        setTraslado(EMPTY_TRASLADO);
        await loadNextCode();
      }

      if (isEdit) {
        await CompraVentaSuplidoresService.editar(payload);
        setMessage(t("productTransferSaved"));
      }

      if (isDelete) {
        await CompraVentaSuplidoresService.eliminar(payload);
        navigate("/compraventasuplidores/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("productTransferSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: "productTransferAddTitle",
    edit: "productTransferEditTitle",
    delete: "productTransferDeleteTitle",
  };

  return (
    <section className={styles.root}>
      <div className={styles.toolbar}>
        <div>
          <Title2 className={styles.title}>{t(titleKeyByMode[mode])}</Title2>
        </div>
        <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
      </div>

      {error ? <MessageBar intent="error">{error}</MessageBar> : null}
      {message ? <MessageBar intent="success">{message}</MessageBar> : null}

      <div className={styles.formSurface} style={themeStyles.surface}>
        {loading ? (
          <div className={styles.loading}>
            <Spinner label={t("loadingProductTransfer")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteProductTransferConfirmation", {
                  code: traslado.codCompraVentaSuplidores,
                })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("productTransferCode")}>
                <Input value={String(traslado.codCompraVentaSuplidores || "")} disabled />
              </Field>
              <Field label={t("productTransferDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={traslado.fecha}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("productTransferSourcePartner")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(socios, traslado.codSuplidorOrigen)}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("origen")}
                  >
                    {t("productTransferLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("productTransferTargetPartner")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(socios, traslado.codSuplidorDestino)}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("destino")}
                  >
                    {t("productTransferLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("productTransferProduct")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(productos, traslado.codProducto)}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("producto")}
                  >
                    {t("productTransferLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("productTransferStandardQuantity")} required={canEditFields}>
                <Input
                  type="number"
                  value={String(traslado.cantidadEstandar ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("cantidadEstandar")}
                />
              </Field>
              <Field label={t("productTransferAmbientQuantity")} required={canEditFields}>
                <Input
                  type="number"
                  value={String(traslado.cantidadAmbiente ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("cantidadAmbiente")}
                />
              </Field>
              <Field label={t("productTransferStatus")}>
                <Switch
                  checked={traslado.estatus !== false}
                  disabled={!canEditFields}
                  label={traslado.estatus !== false ? t("active") : t("inactive")}
                  onChange={updateBoolField("estatus")}
                />
              </Field>
            </div>

            <div className={styles.buttonRow}>
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
              {t("deleteProductTransferConfirmation", { code: traslado.codCompraVentaSuplidores })}
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
        onOpenChange={(_, data) => !data.open && closeLookupDialog()}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>
              {t(
                lookupType === "origen"
                  ? "productTransferSourceSearchTitle"
                  : lookupType === "destino"
                    ? "productTransferTargetSearchTitle"
                    : "productTransferProductSearchTitle"
              )}
            </DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  placeholder={t("productTransferLookupSearchPlaceholder")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("productTransferLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("productTransferLookupName")}</TableHeaderCell>
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
                              {t("productTransferLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          {t("productTransferLookupEmpty")}
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

export default CompraVentaSuplidoresFormPage;
