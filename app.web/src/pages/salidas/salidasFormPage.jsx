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
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { SalidasService } from "../../services/salidasService";
import { SuplidorService } from "../../services/suplidorService";
import {
  getSalidasActionPageThemeStyles,
  useSalidasActionPageStyles,
} from "../../styles/pages/salidas/salidasActionPageStyles";

const EMPTY_SALIDA = {
  idSalida: "",
  codSalida: 0,
  fecha: "",
  codSuplidor: 0,
  codProducto: 0,
  siglasUnidad: "",
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

function buildPayload(salida) {
  return {
    ...salida,
    codSalida: toNumber(salida.codSalida),
    codSuplidor: toNumber(salida.codSuplidor),
    codProducto: toNumber(salida.codProducto),
    cantidadEstandar: toNumber(salida.cantidadEstandar),
    cantidadAmbiente: toNumber(salida.cantidadAmbiente),
    estatus: salida.estatus !== false,
  };
}

function SalidasFormPage({ mode }) {
  const styles = useSalidasActionPageStyles();
  const themeStyles = getSalidasActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const esAjuste = location.pathname === "/ajustes/salida";
  const esUnidad = location.pathname === "/unidad/salida";
  const requiereUnidad = esUnidad;
  const { idSalida = "" } = useParams();
  const { values: salida, setValues: setSalida } = useFormStateAdapter(EMPTY_SALIDA);
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
    () => (lookupType === "suplidor" ? socios : lookupType === "producto" ? productos : []),
    [lookupType, productos, socios]
  );
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );

  const loadNextCode = useCallback(async () => {
    const data = await SalidasService.obtenerKey();
    const nextCode = toNumber(data?.codSalida ?? data?.CodSalida);

    setSalida((current) => ({
      ...current,
      codSalida: nextCode,
    }));
  }, [setSalida]);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        setError("");
        const [sociosData, productosData] = await Promise.all([
          SuplidorService.ListarOpcion(),
          SalidasService.listarProductoCombustibleOpcion(),
        ]);

        if (isMounted) {
          setSocios(Array.isArray(sociosData) ? sociosData : []);
          setProductos(Array.isArray(productosData) ? productosData : []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("exitOptionsLoadError"));
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    async function loadSalida() {
      try {
        setLoading(true);
        setError("");

        if (isAdd) {
          setSalida(EMPTY_SALIDA);
          await loadNextCode();
          return;
        }

        const data = await SalidasService.obtener(idSalida);
        if (isMounted) setSalida({ ...EMPTY_SALIDA, ...data });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("exitLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSalida();

    return () => {
      isMounted = false;
    };
  }, [idSalida, isAdd, loadNextCode, setSalida, t]);

  const updateTextField = (key) => (_, data) => {
    setSalida((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateNumberField = (key) => (_, data) => {
    setSalida((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setSalida((current) => ({
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
    const key = lookupType === "suplidor" ? "codSuplidor" : "codProducto";
    setSalida((current) => ({ ...current, [key]: toNumber(optionValue(option)) }));
    closeLookupDialog();
  };

  const back = () =>
    navigate(
      esAjuste ? "/ajustes/salida/listar" : esUnidad ? "/unidad/salida/listar" : "/salidas/listar"
    );

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.salidaProducto, salida, t, setError).ok) return;

      const payload = buildPayload(salida);

      if (isAdd) {
        await (
          esAjuste
            ? SalidasService.agregarAjuste
            : esUnidad
              ? SalidasService.agregarUnidad
              : SalidasService.agregar
        )(payload);
        setMessage(t("exitAdded"));
        setSalida(EMPTY_SALIDA);
        await loadNextCode();
      }

      if (isEdit) {
        await SalidasService.editar(payload);
        setMessage(t("exitSaved"));
      }

      if (isDelete) {
        await SalidasService.eliminar(payload);
        navigate("/salidas/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("exitSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: "exitAddTitle",
    edit: "exitEditTitle",
    delete: "exitDeleteTitle",
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
            <Spinner label={t("loadingExit")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteExitConfirmation", { code: salida.codSalida })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("exitCode")}>
                <Input value={String(salida.codSalida || "")} disabled />
              </Field>
              <Field label={t("exitDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={salida.fecha}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("exitPartner")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(socios, salida.codSuplidor)}
                    readOnly
                    placeholder={t("selectOption")}
                  />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("suplidor")}
                  >
                    {t("exitLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("exitProduct")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input
                    value={getSelectedOptionText(productos, salida.codProducto)}
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
                    {t("exitLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("exitStandardQuantity")} required={canEditFields}>
                <Input
                  type="number"
                  value={String(salida.cantidadEstandar ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("cantidadEstandar")}
                />
              </Field>
              {requiereUnidad ? (
                <Field label="Siglas de unidad" required={canEditFields}>
                  <Input
                    value={salida.siglasUnidad ?? ""}
                    maxLength={30}
                    disabled={!canEditFields}
                    placeholder="Ej. U-01"
                    onChange={updateTextField("siglasUnidad")}
                  />
                </Field>
              ) : null}
              <Field label={t("exitAmbientQuantity")} required={canEditFields}>
                <Input
                  type="number"
                  value={String(salida.cantidadAmbiente ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("cantidadAmbiente")}
                />
              </Field>
              <Field label={t("exitStatus")}>
                <Switch
                  checked={salida.estatus !== false}
                  disabled={!canEditFields}
                  label={salida.estatus !== false ? t("active") : t("inactive")}
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
            <DialogContent>{t("deleteExitConfirmation", { code: salida.codSalida })}</DialogContent>
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
              {t(lookupType === "suplidor" ? "exitPartnerSearchTitle" : "exitProductSearchTitle")}
            </DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={lookupSearch}
                  placeholder={t("exitLookupSearchPlaceholder")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setLookupSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("exitLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("exitLookupName")}</TableHeaderCell>
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
                              {t("exitLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          {t("exitLookupEmpty")}
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

export default SalidasFormPage;
