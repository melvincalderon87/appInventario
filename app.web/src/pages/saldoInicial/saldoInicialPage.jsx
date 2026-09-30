import { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
} from "@/components/ui/app-shadcn";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Check, Pencil, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useServerPagination } from "../../hooks/useServerPagination";
import { SaldoInicialService } from "../../services/saldoInicialService";
import { SuplidorService } from "../../services/suplidorService";
import { emptyPagedResult } from "../../utils/pagination";
import { getMenuThemeStyles, useMenuStyles } from "../../styles/pages/menu/menuPageStyles";
import { LocalizedDateInput } from "../../components/common/LocalizedDateInput";

const TITLES = {
  COMBUSTIBLE: "Saldo inicial combustible",
  ADITIVO: "Saldo inicial aditivo",
  COLORANTE: "Saldo inicial colorante",
  ETANOL: "Saldo inicial etanol",
};
const currentMonth = () => new Date().toISOString().slice(0, 10);
const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const optionValue = (option) => String(option?.value ?? option?.Value ?? "");
const optionText = (option) => String(option?.text ?? option?.Text ?? "");
const emptyForm = (tipo) => ({
  tipo,
  mes: currentMonth(),
  codSuplidor: "",
  codProducto: "",
  cantidadEstandar: 0,
  cantidadAmbiente: 0,
  cantidad: 0,
});

export default function SaldoInicialPage({ tipo, mode = "list" }) {
  const styles = useMenuStyles();
  const theme = getMenuThemeStyles();
  const navigate = useNavigate();
  const { idSaldoInicial = "" } = useParams();
  const { page, pageSize, search, params, setSearch } = useServerPagination("fecha:desc");
  const [form, setForm] = useState(() => emptyForm(tipo));
  const [suplidores, setSuplidores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [lookupType, setLookupType] = useState("");
  const [lookupSearch, setLookupSearch] = useState("");
  const isList = mode === "list";
  const isEdit = !isList && Boolean(idSaldoInicial);
  const usaDetalleCombustible = tipo === "COMBUSTIBLE" || tipo === "ETANOL";
  const query = useQuery({
    queryKey: ["saldo-inicial", tipo, page, pageSize, search],
    queryFn: () => SaldoInicialService.listado(tipo, { ...params, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });
  const result = query.data ?? emptyPagedResult;
  const items = Array.isArray(result.items) ? result.items : [];

  useEffect(() => {
    if (isList) return undefined;
    let active = true;
    Promise.all([
      SaldoInicialService.productos(tipo),
      usaDetalleCombustible ? SuplidorService.ListarOpcion() : Promise.resolve([]),
    ])
      .then(async ([products, suppliers]) => {
        if (!active) return;
        setProductos(Array.isArray(products) ? products : []);
        setSuplidores(Array.isArray(suppliers) ? suppliers : []);
        if (isEdit) {
          const item = await SaldoInicialService.obtener(idSaldoInicial, tipo);
          if (active)
            setForm({ ...emptyForm(tipo), ...item, mes: String(item.fecha ?? "").slice(0, 10) });
        }
      })
      .catch((loadError) => active && setError(loadError.message));
    return () => {
      active = false;
    };
  }, [idSaldoInicial, isEdit, isList, tipo, usaDetalleCombustible]);

  const update = (key) => (_, data) => setForm((current) => ({ ...current, [key]: data.value }));
  const selectedText = (options, value) =>
    optionText(options.find((option) => optionValue(option) === String(value)));
  const lookupOptions = lookupType === "suplidor" ? suplidores : productos;
  const filteredOptions = useMemo(() => {
    const term = lookupSearch.trim().toLowerCase();
    return term
      ? lookupOptions.filter((option) =>
          `${optionValue(option)} ${optionText(option)}`.toLowerCase().includes(term)
        )
      : lookupOptions;
  }, [lookupOptions, lookupSearch]);
  const selectOption = (option) => {
    const field = lookupType === "suplidor" ? "codSuplidor" : "codProducto";
    setForm((current) => ({ ...current, [field]: optionValue(option) }));
    setLookupType("");
  };
  const save = async () => {
    setError("");
    setSuccess("");
    if (!form.mes || !form.codProducto || (usaDetalleCombustible && !form.codSuplidor)) {
      setError("Complete los campos requeridos.");
      return;
    }
    const payload = {
      ...form,
      tipo,
      fecha: form.mes,
      codSuplidor: asNumber(form.codSuplidor),
      codProducto: asNumber(form.codProducto),
      cantidadEstandar: asNumber(form.cantidadEstandar),
      cantidadAmbiente: asNumber(form.cantidadAmbiente),
      cantidad: asNumber(form.cantidad),
    };
    try {
      setSaving(true);
      if (isEdit) await SaldoInicialService.editar(payload);
      else await SaldoInicialService.agregar(payload);
      setSuccess(
        isEdit
          ? "Saldo inicial actualizado correctamente."
          : "Saldo inicial mensual agregado correctamente."
      );
      if (!isEdit) setForm(emptyForm(tipo));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };
  const openLookup = (type) => {
    setLookupSearch("");
    setLookupType(type);
  };
  const formFields = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        padding: 20,
      }}
    >
      <Field label="Correlativo">
        <Input value={isEdit ? String(form.codSaldoInicial ?? "") : "Automático"} disabled />
      </Field>
      <Field label="Fecha" required>
        <LocalizedDateInput value={form.mes} onChange={update("mes")} />
      </Field>
      {usaDetalleCombustible && (
        <Field label="Suplidor" required>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              value={selectedText(suplidores, form.codSuplidor)}
              readOnly
              placeholder="Seleccione"
            />
            <Button appearance="secondary" icon={<Search />} onClick={() => openLookup("suplidor")}>
              Buscar
            </Button>
          </div>
        </Field>
      )}
      <Field label="Producto" required>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            value={selectedText(productos, form.codProducto)}
            readOnly
            placeholder="Seleccione"
          />
          <Button appearance="secondary" icon={<Search />} onClick={() => openLookup("producto")}>
            Buscar
          </Button>
        </div>
      </Field>
      {usaDetalleCombustible ? (
        <>
          <Field label="Cantidad estándar" required>
            <Input
              type="number"
              min="0"
              step="0.0001"
              value={String(form.cantidadEstandar)}
              onChange={update("cantidadEstandar")}
            />
          </Field>
          <Field label="Cantidad ambiente" required>
            <Input
              type="number"
              min="0"
              step="0.0001"
              value={String(form.cantidadAmbiente)}
              onChange={update("cantidadAmbiente")}
            />
          </Field>
        </>
      ) : (
        <Field label="Cantidad" required>
          <Input
            type="number"
            min="0"
            value={String(form.cantidad)}
            onChange={update("cantidad")}
          />
        </Field>
      )}
    </div>
  );
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.title}>
            {isList ? `${TITLES[tipo]} - Listado` : `${TITLES[tipo]}${isEdit ? " - Editar" : ""}`}
          </Title2>
          <Text className={styles.subtitle}>
            Solo se permite un documento por tipo y mes; puede editarse posteriormente.
          </Text>
        </div>
        <Button
          appearance="primary"
          onClick={() =>
            navigate(
              isList
                ? `/saldo-inicial/${tipo.toLowerCase()}/agregar`
                : `/saldo-inicial/${tipo.toLowerCase()}/listar`
            )
          }
        >
          {isList ? "Agregar" : "Regresar"}
        </Button>
      </div>
      {error && <MessageBar intent="error">{error}</MessageBar>}
      {success && <MessageBar intent="success">{success}</MessageBar>}
      {!isList && (
        <div className={styles.listSurface} style={theme.surface}>
          {formFields}
          <div style={{ padding: "0 20px 20px" }}>
            <Button appearance="primary" disabled={saving} onClick={save}>
              {saving ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </div>
      )}
      {isList && (
        <>
          <div className={styles.searchBar} style={theme.surface}>
            <Input
              value={search}
              onChange={(_, data) => setSearch(data.value)}
              contentBefore={<Search />}
              placeholder="Buscar documentos anteriores"
            />
          </div>
          <div className={styles.listSurface}>
            {query.isLoading ? (
              <Spinner label="Cargando documentos..." />
            ) : items.length ? (
              <div className={styles.menuTableSurface} style={theme.surface}>
                <div className={styles.menuTableScroll}>
                  <table className={styles.menuTable}>
                    <thead>
                      <tr>
                        <th className={styles.menuHeaderCell}>Código</th>
                        <th className={styles.menuHeaderCell}>Mes / año</th>
                        {usaDetalleCombustible && (
                          <th className={styles.menuHeaderCell}>Suplidor</th>
                        )}
                        <th className={styles.menuHeaderCell}>Producto</th>
                        {usaDetalleCombustible ? (
                          <>
                            <th className={styles.menuHeaderCell}>Estándar</th>
                            <th className={styles.menuHeaderCell}>Ambiente</th>
                          </>
                        ) : (
                          <th className={styles.menuHeaderCell}>Cantidad</th>
                        )}
                        <th className={styles.menuHeaderCell}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.idSaldoInicial} className={styles.menuRow}>
                          <td className={styles.menuCell}>{item.codSaldoInicial}</td>
                          <td className={styles.menuCell}>
                            {item.fecha
                              ? new Date(
                                  `${String(item.fecha).slice(0, 10)}T00:00:00`
                                ).toLocaleDateString(undefined, {
                                  month: "2-digit",
                                  year: "numeric",
                                })
                              : ""}
                          </td>
                          {usaDetalleCombustible && (
                            <td className={styles.menuCell}>{item.suplidor}</td>
                          )}
                          <td className={styles.menuCell}>{item.producto}</td>
                          {usaDetalleCombustible ? (
                            <>
                              <td className={styles.menuCell}>{item.cantidadEstandar}</td>
                              <td className={styles.menuCell}>{item.cantidadAmbiente}</td>
                            </>
                          ) : (
                            <td className={styles.menuCell}>{item.cantidad}</td>
                          )}
                          <td className={styles.menuCell}>
                            <Button
                              size="small"
                              icon={<Pencil />}
                              onClick={() =>
                                navigate(
                                  `/saldo-inicial/${tipo.toLowerCase()}/editar/${encodeURIComponent(item.idSaldoInicial)}`
                                )
                              }
                            >
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Text className={styles.empty}>No hay documentos anteriores.</Text>
            )}
          </div>
        </>
      )}
      <Dialog
        open={Boolean(lookupType)}
        onOpenChange={(_, data) => !data.open && setLookupType("")}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Buscar {lookupType === "suplidor" ? "suplidor" : "producto"}</DialogTitle>
            <DialogContent>
              <Input
                autoFocus
                value={lookupSearch}
                contentBefore={<Search />}
                placeholder="Buscar"
                onChange={(_, data) => setLookupSearch(data.value)}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Código</TableHeaderCell>
                    <TableHeaderCell>Descripción</TableHeaderCell>
                    <TableHeaderCell>Acción</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOptions.map((option) => (
                    <TableRow key={optionValue(option)}>
                      <TableCell>{optionValue(option)}</TableCell>
                      <TableCell>{optionText(option)}</TableCell>
                      <TableCell>
                        <Button size="small" icon={<Check />} onClick={() => selectOption(option)}>
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setLookupType("")}>
                Cerrar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}
