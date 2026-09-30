function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function formatHeightMeasurement(value) {
  const pies = toNumber(value?.pies);
  const pulgadas = toNumber(value?.pulgadas);
  const dieciseisavos = toNumber(value?.dieciseisavos);
  const fraccion = dieciseisavos > 0 ? ` ${dieciseisavos}/16` : "";

  return `${pies}' ${pulgadas}${fraccion}"`;
}
