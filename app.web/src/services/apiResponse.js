export const SESSION_EXPIRED_MESSAGE = "Sesion expirada";

export async function readApiPayload(response) {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  } catch {
    return null;
  }
}

export function getApiMessage(payload, fallbackMessage = "") {
  if (typeof payload === "string") {
    return payload || fallbackMessage;
  }

  return payload?.msj || payload?.message || fallbackMessage;
}

export async function readApiErrorMessage(response, fallbackMessage = "") {
  const payload = await readApiPayload(response);
  return getApiMessage(payload, fallbackMessage);
}

export async function handleApiResponse(response, fallbackMessage = "") {
  if (response.status === 401) {
    throw new Error(await readApiErrorMessage(response, SESSION_EXPIRED_MESSAGE));
  }

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallbackMessage));
  }

  const payload = await readApiPayload(response);

  if (payload?.estatus === false) {
    throw new Error(getApiMessage(payload, fallbackMessage));
  }

  return payload;
}
