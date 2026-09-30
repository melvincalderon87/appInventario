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
  Switch,
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
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { BahiaService } from "../../services/bahiaService";
import { BrazoService } from "../../services/brazoService";
import { MetroService } from "../../services/metroService";
import { ProductoService } from "../../services/productoService";
import {
  getMetroActionPageThemeStyles,
  useMetroActionPageStyles,
} from "../../styles/pages/metro/metroActionPageStyles";

const EMPTY_METRO = {
  idMetro: "",
  codMetro: "",
  codBahia: "",
  bahia: "",
  codBrazo: "",
  brazo: "",
  codProducto: "",
  producto: "",
  metro: "",
  tipoMetro: "",
  modelo: "",
  serie: "",
  comentario: "",
  estatus: true,
};

const METRO_TYPES = ["Turbina", "Desplazamiento Positivo", "Modelo Genesis"];

function optionValue(option) {
  return String(option?.value ?? option?.Value ?? "");
}

function optionText(option) {
  return String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
}

function optionBahiaValue(option) {
  return String(option?.codBahia ?? option?.CodBahia ?? "");
}

function getSelectedOptionText(options, value, fallback = "") {
  const selectedValue = String(value ?? "");
  if (!selectedValue) return "";

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

function normalizeMetro(data) {
  return {
    ...EMPTY_METRO,
    ...data,
    codMetro: String(data?.codMetro ?? ""),
    codBahia: String(data?.codBahia ?? ""),
    codBrazo: String(data?.codBrazo ?? ""),
    codProducto: String(data?.codProducto ?? ""),
    comentario: data?.comentario ?? "",
    estatus: data?.estatus !== false,
  };
}

function MetroFormPage({ mode }) {
  const styles = useMetroActionPageStyles();
  const themeStyles = getMetroActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idMetro = "" } = useParams();
  const { values: metro, setValues: setMetro } = useFormStateAdapter(EMPTY_METRO);
  const [bahias, setBahias] = useState([]);
  const [brazos, setBrazos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;
  const selectedBahiaLabel = getSelectedOptionText(bahias, metro.codBahia, metro.bahia);
  const selectedProductoLabel = getSelectedOptionText(productos, metro.codProducto, metro.producto);
  const brazosFiltrados = useMemo(() => {
    const codBahia = String(metro.codBahia ?? "").trim();
    if (!codBahia) return [];

    return brazos.filter((option) => optionBahiaValue(option) === codBahia);
  }, [brazos, metro.codBahia]);
  const isBayLookup = lookupType === "bahia";
  const lookupOptions = isBayLookup ? bahias : productos;
  const filteredLookupOptions = useMemo(
    () => filterLookupOptions(lookupOptions, lookupSearch),
    [lookupOptions, lookupSearch]
  );
  const lookupTitle = isBayLookup ? t("meterBaySearchTitle") : t("meterProductSearchTitle");
  const lookupSearchPlaceholder = isBayLookup ? t("meterSearchBay") : t("meterSearchProduct");
  const lookupEmptyMessage = isBayLookup ? t("meterNoBaysFound") : t("meterNoProductsFound");

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      const [bahiasData, brazosData, productosData] = await Promise.allSettled([
        BahiaService.ListarOpcion(),
        BrazoService.ListarOpcion(),
        ProductoService.ListarOpcion(),
      ]);

      if (!isMounted) return;

      setBahias(
        bahiasData.status === "fulfilled" && Array.isArray(bahiasData.value) ? bahiasData.value : []
      );
      setBrazos(
        brazosData.status === "fulfilled" && Array.isArray(brazosData.value) ? brazosData.value : []
      );
      setProductos(
        productosData.status === "fulfilled" && Array.isArray(productosData.value)
          ? productosData.value
          : []
      );
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

    async function loadMetro() {
      try {
        setLoading(true);
        setError("");
        const data = await MetroService.obtener(idMetro);
        if (isMounted) setMetro(normalizeMetro(data));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("meterLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMetro();

    return () => {
      isMounted = false;
    };
  }, [idMetro, isAdd, setMetro, t]);

  const updateField = (key) => (_, data) => {
    setMetro((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateArmField = (_, data) => {
    const value = String(data.value ?? "");
    const selectedOption = brazosFiltrados.find((option) => optionValue(option) === value);

    setMetro((current) => ({
      ...current,
      codBrazo: value,
      brazo: selectedOption ? optionText(selectedOption) : "",
    }));
  };

  const updateBoolField = (key) => (_, data) => {
    setMetro((current) => ({
      ...current,
      [key]: Boolean(data.checked),
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

    setMetro((current) => {
      if (isBayLookup) {
        const currentBahia = String(current.codBahia ?? "");
        return {
          ...current,
          codBahia: value,
          bahia: text,
          codBrazo: currentBahia === value ? current.codBrazo : "",
          brazo: currentBahia === value ? current.brazo : "",
        };
      }

      return {
        ...current,
        codProducto: value,
        producto: text,
      };
    });

    closeLookupDialog();
  };

  const back = () => navigate("/metro/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/metro/editar",
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

    navigate(`/metro/editar/${encodeURIComponent(idMetro)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!setZodValidationError(formSchemas.metro, metro, t, setError).ok) return;

      const payload = {
        ...metro,
        codMetro: String(metro.codMetro ?? "").trim(),
        codBahia: String(metro.codBahia ?? "").trim(),
        codBrazo: String(metro.codBrazo ?? "").trim(),
        codProducto: String(metro.codProducto ?? "").trim(),
        metro: String(metro.metro ?? "").trim(),
        tipoMetro: String(metro.tipoMetro ?? "").trim(),
        modelo: String(metro.modelo ?? "").trim(),
        serie: String(metro.serie ?? "").trim(),
        comentario: String(metro.comentario ?? "").trim(),
        estatus: metro.estatus !== false,
      };

      if (isAdd) {
        await MetroService.agregar(payload);
        setMessage(t("meterAdded"));
        setMetro(EMPTY_METRO);
      }

      if (isEdit) {
        await MetroService.editar(payload);
        setMessage(t("meterSaved"));
      }

      if (isDelete) {
        await MetroService.eliminar(payload);
        navigate("/metro/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("meterSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: "meterAddTitle",
    view: "meterViewTitle",
    edit: "meterEditTitle",
    delete: "meterDeleteTitle",
  };
  const deleteMeterReference = String(metro.codMetro || metro.metro || "");

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
            <Spinner label={t("loadingMeter")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteMeterConfirmation", { meter: deleteMeterReference })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              <Field label={t("meterCode")} required={isAdd}>
                <Input
                  maxLength={20}
                  value={String(metro.codMetro ?? "")}
                  disabled={!isAdd}
                  onChange={updateField("codMetro")}
                />
              </Field>
              <Field label={t("meterBay")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedBahiaLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("bahia")}
                  >
                    {t("meterLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("meterArm")} required={canEditFields}>
                <Select
                  value={String(metro.codBrazo ?? "")}
                  disabled={!canEditFields || !metro.codBahia}
                  onChange={updateArmField}
                >
                  <option value="">
                    {metro.codBahia ? t("selectOption") : t("meterSelectBayFirst")}
                  </option>
                  {metro.codBahia && brazosFiltrados.length === 0 ? (
                    <option value="" disabled>
                      {t("meterNoArmsForBay")}
                    </option>
                  ) : null}
                  {brazosFiltrados.map((option) => (
                    <option key={optionValue(option)} value={optionValue(option)}>
                      {optionText(option)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("meterProduct")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedProductoLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={() => openLookupDialog("producto")}
                  >
                    {t("meterLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("meterName")} required={canEditFields}>
                <Input
                  maxLength={200}
                  value={metro.metro ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("metro")}
                />
              </Field>
              <Field label={t("meterType")} required={canEditFields}>
                <Select
                  value={metro.tipoMetro ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("tipoMetro")}
                >
                  <option value="">{t("selectOption")}</option>
                  {METRO_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("meterModel")} required={canEditFields}>
                <Input
                  maxLength={200}
                  value={metro.modelo ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("modelo")}
                />
              </Field>
              <Field label={t("meterSeries")} required={canEditFields}>
                <Input
                  maxLength={200}
                  value={metro.serie ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("serie")}
                />
              </Field>
              <Field label={t("meterComment")}>
                <Textarea
                  maxLength={250}
                  rows={3}
                  value={metro.comentario ?? ""}
                  disabled={!canEditFields}
                  onChange={updateField("comentario")}
                />
              </Field>
              <Field label={t("meterStatus")}>
                <Switch
                  checked={metro.estatus !== false}
                  disabled={!canEditFields}
                  label={metro.estatus !== false ? t("active") : t("inactive")}
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
                      <TableHeaderCell>{t("meterLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("meterLookupName")}</TableHeaderCell>
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
                              {t("meterLookupSelect")}
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

      <Dialog open={openDeleteConfirm} onOpenChange={(_, data) => setOpenDeleteConfirm(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogContent>
              {t("deleteMeterConfirmation", { meter: deleteMeterReference })}
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

export default MetroFormPage;
