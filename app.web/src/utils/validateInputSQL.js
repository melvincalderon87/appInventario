import { z } from "zod";

const FORBIDDEN_SQL_PATTERN =
  /(--|;|\/\*|\*\/|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE|OR|AND)\b)/i;

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function containsForbiddenPattern(value) {
  return FORBIDDEN_SQL_PATTERN.test(value);
}

const loginTextField = (message = "requiredFields") =>
  z
    .any()
    .transform((value) => normalizeValue(value))
    .refine((value) => value.length > 0, { message })
    .refine((value) => !containsForbiddenPattern(value), { message: "invalidLoginInput" });

const loginPasswordField = z
  .any()
  .transform((value) => String(value ?? ""))
  .refine((value) => value.trim().length > 0, { message: "requiredFields" })
  .refine((value) => !containsForbiddenPattern(value), { message: "invalidLoginInput" });

export const loginPayloadSchema = z.object({
  codUsuario: loginTextField(),
  password: loginPasswordField,
});

export const loginFormSchema = loginPayloadSchema.pick({
  codUsuario: true,
  password: true,
});

export function sanitizeLoginPayload(payload) {
  const sanitized = {
    codUsuario: normalizeValue(payload.codUsuario),
    password: String(payload.password ?? ""),
  };

  return sanitized;
}

export function validateLoginPayload(payload) {
  const validation = loginPayloadSchema.safeParse(payload);

  if (!validation.success) {
    return {
      ok: false,
      sanitized: sanitizeLoginPayload(payload),
      errorKey: validation.error.issues[0]?.message ?? "requiredFields",
    };
  }

  return {
    ok: true,
    sanitized: validation.data,
  };
}
