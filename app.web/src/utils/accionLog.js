export const ACCION_LOG = Object.freeze({
  CREATE: "C",
  UPDATE: "U",
  DELETE: "D",
});

export function getAccionLogLabel(accionLog, t) {
  const accion = String(accionLog ?? "")
    .trim()
    .toUpperCase();

  if (accion === ACCION_LOG.CREATE) return t("accionLogCreate");
  if (accion === ACCION_LOG.UPDATE) return t("accionLogUpdate");
  if (accion === ACCION_LOG.DELETE) return t("accionLogDelete");

  return t("accionLogUnknown");
}
