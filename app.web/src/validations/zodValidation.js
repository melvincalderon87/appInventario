import { z } from "zod";

export function toFiniteNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function requiredString(message) {
  return z.any().refine((value) => String(value ?? "").trim().length > 0, { message });
}

export function requiredShortString(requiredMessage, maxLengthMessage, maxLength = 10) {
  return requiredString(requiredMessage).refine(
    (value) => String(value ?? "").length <= maxLength,
    { message: maxLengthMessage }
  );
}

export function requiredPositiveNumber(message) {
  return z.any().refine((value) => toFiniteNumber(value) > 0, { message });
}

export function requiredNonNegativeNumber(message) {
  return z.any().refine((value) => toFiniteNumber(value) >= 0, { message });
}

export function getZodErrorMessageKey(error, fallbackKey = "requiredFields") {
  return error?.issues?.[0]?.message || fallbackKey;
}

export function validateWithZod(schema, values, t, fallbackKey = "requiredFields") {
  const validation = schema.safeParse(values);

  if (validation.success) {
    return { ok: true, data: validation.data };
  }

  return {
    ok: false,
    error: t(getZodErrorMessageKey(validation.error, fallbackKey)),
    errorKey: getZodErrorMessageKey(validation.error, fallbackKey),
  };
}

export function setZodValidationError(schema, values, t, setError, fallbackKey = "requiredFields") {
  const validation = validateWithZod(schema, values, t, fallbackKey);

  if (!validation.ok) {
    setError(validation.error);
  }

  return validation;
}

export function getReactHookFormErrorKey(errors, fallbackKey = "requiredFields") {
  const pending = Object.values(errors ?? {});

  while (pending.length > 0) {
    const current = pending.shift();

    if (!current || typeof current !== "object") continue;
    if (current.message) return current.message;

    pending.push(...Object.values(current));
  }

  return fallbackKey;
}

export function validateDateFilterResult(result, error) {
  const validation = z
    .object({
      isValid: z.literal(true),
      value: z.string(),
    })
    .safeParse(result);

  if (validation.success) {
    return { ok: true, value: validation.data.value };
  }

  return { ok: false, error };
}
