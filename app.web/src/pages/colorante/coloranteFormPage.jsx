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
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formSchemas } from "../../validations/formSchemas";
import { setZodValidationError } from "../../validations/zodValidation";
import { useNavigate, useParams } from "react-router-dom";
import { ListActionButton } from "../../components/common/ListActionButton";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";
import { PERMISOS } from "../../config/permisos";
import { validarPermiso } from "../../services/authService";
import { ColoranteService } from "../../services/coloranteService";
import { BarcoService } from "../../services/barcoService";
import { SuplidorService } from "../../services/suplidorService";
import {
  getColoranteActionPageThemeStyles,
  useColoranteActionPageStyles,
} from "../../styles/pages/colorante/coloranteActionPageStyles";

const MOVEMENT_GROUP_INGRESO = ["INGRESO", "AJUSTE"];
const MOVEMENT_GROUP_SALIDA = ["INYECTAR_MANIFOLD", "PRESTAMO", "SALIDA"];

const EMPTY_COLORANTE = {
  idColorante: "",
  codDocumento: 0,
  codProducto: "",
  producto: "",
  fecha: "",
  tipoMovimiento: "INGRESO",
  codBarco: 0,
  codSuplidor: 0,
  cantidad: 0,
  comentarios: "",
};

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeMovement(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function isSalidaMovimiento(value) {
  return MOVEMENT_GROUP_SALIDA.includes(normalizeMovement(value));
}

function optionValue(option) {
  return String(option?.value ?? option?.Value ?? "");
}

function optionText(option) {
  return String(option?.text ?? option?.Text ?? option?.label ?? optionValue(option));
}

function filterProducts(options, search) {
  const searchText = String(search ?? "")
    .trim()
    .toLowerCase();
  if (!searchText) return options;

  return options.filter((option) =>
    `${optionValue(option)} ${optionText(option)}`.toLowerCase().includes(searchText)
  );
}

function getMovementOptions(isSalidaScreen, selected) {
  const values = isSalidaScreen ? MOVEMENT_GROUP_SALIDA.slice() : MOVEMENT_GROUP_INGRESO.slice();
  const selectedNormalized = normalizeMovement(selected);

  if (selectedNormalized && !values.includes(selectedNormalized)) {
    values.push(selectedNormalized);
  }

  const uniqueValues = [...new Set(values)];
  return uniqueValues.map((value) => ({ value }));
}

function getMovementLabel(value, t) {
  const normalized = normalizeMovement(value);

  if (normalized === "AJUSTE") return t("colorantMovementAdjust");
  if (normalized === "INYECTAR_MANIFOLD") return t("colorantMovementInjection");
  if (normalized === "PRESTAMO") return t("colorantMovementLoan");
  if (normalized === "SALIDA") return t("colorantMovementOut");

  return t("colorantMovementIn");
}

function getSchema(mode, isSalidaScreen) {
  if (mode === "delete") return formSchemas.colorante;

  return isSalidaScreen ? formSchemas.coloranteSalida : formSchemas.colorante;
}

function ColoranteFormPage({ mode, movementType = "INGRESO" }) {
  const styles = useColoranteActionPageStyles();
  const themeStyles = getColoranteActionPageThemeStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { idColorante = "" } = useParams();
  const initialMovement = useMemo(
    () => normalizeMovement(movementType) || "INGRESO",
    [movementType]
  );
  const initialColorante = useMemo(
    () => ({ ...EMPTY_COLORANTE, tipoMovimiento: initialMovement }),
    [initialMovement]
  );
  const isAdd = mode === "add";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";
  const canEditFields = isAdd || isEdit;

  const { values: colorante, setValues: setColorante } = useFormStateAdapter(initialColorante);
  const [productos, setProductos] = useState([]);
  const [barcos, setBarcos] = useState([]);
  const [suplidores, setSuplidores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [productLookupOpen, setProductLookupOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentMovement = useMemo(
    () => normalizeMovement(colorante.tipoMovimiento || initialMovement),
    [colorante.tipoMovimiento, initialMovement]
  );
  const isSalidaScreen = isSalidaMovimiento(currentMovement);
  const filteredProducts = useMemo(
    () => filterProducts(productos, productSearch),
    [productos, productSearch]
  );
  const selectedProductLabel = useMemo(() => {
    const selected = productos.find(
      (option) => optionValue(option) === String(colorante.codProducto ?? "")
    );
    return selected ? optionText(selected) : String(colorante.producto ?? "");
  }, [colorante.codProducto, colorante.producto, productos]);

  useEffect(() => {
    let isMounted = true;

    async function loadDependencies() {
      try {
        setLoadingDependencies(true);
        setError("");

        const [productoOptions, barcoOptions, suplidorOptions] = await Promise.all([
          ColoranteService.ListarProductoOpcion(),
          BarcoService.ListarOpcion(),
          SuplidorService.ListarOpcion(),
        ]);

        if (isMounted) {
          setProductos(Array.isArray(productoOptions) ? productoOptions : []);
          setBarcos(Array.isArray(barcoOptions) ? barcoOptions : []);
          setSuplidores(Array.isArray(suplidorOptions) ? suplidorOptions : []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("colorantLoadError"));
      } finally {
        if (isMounted) setLoadingDependencies(false);
      }
    }

    loadDependencies();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    if (!isAdd) {
      return undefined;
    }

    setColorante(initialColorante);
    return undefined;
  }, [initialColorante, isAdd, setColorante]);

  useEffect(() => {
    if (isAdd) {
      return undefined;
    }

    let isMounted = true;

    async function loadColorante() {
      try {
        setLoading(true);
        setError("");
        const data = await ColoranteService.obtener(idColorante);
        if (isMounted) {
          setColorante({
            ...EMPTY_COLORANTE,
            ...data,
            tipoMovimiento: normalizeMovement(data.tipoMovimiento) || "INGRESO",
            fecha: toDateInputValue(data.fecha),
            codProducto: String(data.codProducto ?? ""),
            codBarco: toNumber(data.codBarco),
            codSuplidor: toNumber(data.codSuplidor),
            cantidad: toNumber(data.cantidad),
          });
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || t("colorantLoadError"));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadColorante();

    return () => {
      isMounted = false;
    };
  }, [idColorante, isAdd, setColorante, t]);

  const updateNumberField = (key) => (_, data) => {
    setColorante((current) => ({
      ...current,
      [key]: toNumber(data.value),
    }));
  };

  const updateTextField = (key) => (_, data) => {
    setColorante((current) => ({
      ...current,
      [key]: data.value,
    }));
  };

  const updateMovement = (_, data) => {
    setColorante((current) => ({
      ...current,
      tipoMovimiento: normalizeMovement(data.value),
    }));
  };

  const openProductLookup = () => {
    if (!canEditFields) return;

    setProductSearch("");
    setProductLookupOpen(true);
  };

  const closeProductLookup = () => {
    setProductLookupOpen(false);
    setProductSearch("");
  };

  const selectProduct = (option) => {
    setColorante((current) => ({
      ...current,
      codProducto: optionValue(option),
      producto: optionText(option),
    }));
    closeProductLookup();
  };

  const back = () =>
    navigate(isSalidaScreen ? "/colorante/salida/listar" : "/colorante/ingreso/listar");

  const goEdit = async () => {
    const response = await validarPermiso({
      ruta: "/colorante/editar",
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

    navigate(`/colorante/editar/${encodeURIComponent(idColorante)}`);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const movimientoNormalizado = normalizeMovement(colorante.tipoMovimiento);
      const isSalida = isSalidaMovimiento(movimientoNormalizado);
      const schema = getSchema(mode, isSalida);

      const payload = {
        ...colorante,
        codProducto: String(colorante.codProducto ?? "").trim(),
        fecha: colorante.fecha,
        tipoMovimiento: movimientoNormalizado,
        cantidad: toNumber(colorante.cantidad),
        codBarco: toNumber(colorante.codBarco),
        codSuplidor: toNumber(colorante.codSuplidor),
        comentarios: String(colorante.comentarios ?? "").trim(),
      };

      if (!setZodValidationError(schema, payload, t, setError).ok) return;

      if (isAdd) {
        await ColoranteService.agregar(payload);
        setMessage(isSalida ? t("colorantExitAdded") : t("colorantEntryAdded"));

        setColorante({
          ...EMPTY_COLORANTE,
          tipoMovimiento: initialMovement,
        });

        return;
      }

      if (isEdit) {
        await ColoranteService.editar(payload);
        setMessage(t("colorantSaved"));
      }

      if (isDelete) {
        await ColoranteService.eliminar(payload);
        navigate(isSalida ? "/colorante/salida/listar" : "/colorante/ingreso/listar");
      }
    } catch (saveError) {
      setError(saveError.message || t("colorantSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setOpenDeleteConfirm(false);
    await save();
  };

  const titleKeyByMode = {
    add: isSalidaScreen ? "colorantExitTitle" : "colorantEntryTitle",
    view: "colorantViewTitle",
    edit: "colorantEditTitle",
    delete: "colorantDeleteTitle",
  };

  const coloranteLabel = `${colorante.producto || t("colorantSelectedProductFallback")} ${toDateInputValue(colorante.fecha)} ${colorante.tipoMovimiento || ""}`;
  const movementOptions = getMovementOptions(isSalidaScreen, colorante.tipoMovimiento);

  if (loadingDependencies) {
    return (
      <section className={styles.root}>
        <div className={styles.toolbar}>
          <div>
            <Title2 className={styles.title}>{t(titleKeyByMode[mode])}</Title2>
          </div>
          <ListActionButton action="regresar" label={t("back")} text={t("back")} onClick={back} />
        </div>
        <div className={styles.formSurface} style={themeStyles.surface}>
          <div className={styles.loading}>
            <Spinner label={t("loadingColorant")} />
          </div>
        </div>
      </section>
    );
  }

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
            <Spinner label={t("loadingColorant")} />
          </div>
        ) : (
          <>
            {isDelete ? (
              <MessageBar intent="warning">
                {t("deleteColorantConfirmation", { colorant: coloranteLabel })}
              </MessageBar>
            ) : null}

            <div className={styles.formGrid}>
              {!isAdd ? (
                <Field label={t("colorantCode")}>
                  <Input value={String(colorante.codDocumento ?? "")} disabled />
                </Field>
              ) : null}
              <Field label={t("colorantProduct")} required={canEditFields}>
                <div className={styles.lookupControl}>
                  <Input value={selectedProductLabel} readOnly placeholder={t("selectOption")} />
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={<Search />}
                    disabled={!canEditFields}
                    onClick={openProductLookup}
                  >
                    {t("colorantLookupSearch")}
                  </Button>
                </div>
              </Field>
              <Field label={t("colorantDate")} required={canEditFields}>
                <LocalizedDateInput
                  value={toDateInputValue(colorante.fecha)}
                  disabled={!canEditFields}
                  onChange={updateTextField("fecha")}
                />
              </Field>
              <Field label={t("colorantMovement")} required={canEditFields}>
                <Select
                  value={normalizeMovement(colorante.tipoMovimiento)}
                  disabled={!canEditFields}
                  onChange={updateMovement}
                >
                  <option value="">{t("selectOption")}</option>
                  {movementOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {getMovementLabel(option.value, t)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Barco">
                <Select
                  value={String(colorante.codBarco || "")}
                  disabled={!canEditFields}
                  onChange={updateNumberField("codBarco")}
                >
                  <option value="">{t("selectOption")}</option>
                  {barcos.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("colorantPartner")}>
                <Select
                  value={String(colorante.codSuplidor || "")}
                  disabled={!canEditFields}
                  onChange={updateNumberField("codSuplidor")}
                >
                  <option value="">{t("selectOption")}</option>
                  {suplidores.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.text}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("colorantQuantity")} required={canEditFields}>
                <Input
                  type="number"
                  value={String(colorante.cantidad ?? 0)}
                  disabled={!canEditFields}
                  onChange={updateNumberField("cantidad")}
                />
              </Field>
              <Field label={t("colorantComments")}>
                <Textarea
                  value={colorante.comentarios ?? ""}
                  disabled={!canEditFields}
                  onChange={updateTextField("comentarios")}
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
                  onClick={goEdit}
                />
              ) : null}
              {isAdd ? (
                <ListActionButton
                  action={isSalidaMovimiento(initialMovement) ? "salida" : "ingreso"}
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
              {t("deleteColorantConfirmation", { colorant: coloranteLabel })}
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
        open={productLookupOpen}
        onOpenChange={(_, data) => !data.open && closeProductLookup()}
      >
        <DialogSurface className={styles.lookupDialogSurface} data-lookup-dialog>
          <DialogBody>
            <DialogTitle>{t("colorantProductSearchTitle")}</DialogTitle>
            <DialogContent>
              <div className={styles.lookupSearchRow}>
                <Input
                  autoFocus
                  value={productSearch}
                  placeholder={t("colorantSearchProduct")}
                  contentBefore={<Search />}
                  onChange={(_, data) => setProductSearch(data.value)}
                />
              </div>
              <div className={styles.lookupTableWrap}>
                <Table className={styles.lookupTable}>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>{t("colorantLookupCode")}</TableHeaderCell>
                      <TableHeaderCell>{t("colorantLookupName")}</TableHeaderCell>
                      <TableHeaderCell className={styles.lookupActionCell}>
                        {t("actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((option) => (
                        <TableRow
                          key={optionValue(option)}
                          className={styles.lookupTableRow}
                          onDoubleClick={() => selectProduct(option)}
                        >
                          <TableCell>{optionValue(option)}</TableCell>
                          <TableCell>{optionText(option)}</TableCell>
                          <TableCell className={styles.lookupActionCell}>
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<Check />}
                              onClick={() => selectProduct(option)}
                            >
                              {t("colorantLookupSelect")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className={styles.lookupEmptyCell}>
                          <Text>{t("colorantNoProductsFound")}</Text>
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
                onClick={closeProductLookup}
              />
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}

export default ColoranteFormPage;
