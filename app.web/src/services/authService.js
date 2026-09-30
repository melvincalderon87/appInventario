import { config } from "../config/config";
import { handleApiResponse } from "./apiResponse";

export async function login({ codUsuario, password }) {
  let response;

  try {
    response = await fetch(`${config.apiUrl}/login/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        codUsuario,
        password,
      }),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con la API. Verifica que el backend este corriendo en https://localhost:5002."
    );
  }

  return await handleApiResponse(response, "No fue posible iniciar sesion.");
}
export async function validarSesion() {
  try {
    const response = await fetch(`${config.apiUrl}/login/validarsesion`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data?.ok === true;
  } catch {
    return false;
  }
}

export async function validarPantalla({ ruta }) {
  try {
    const searchParams = new URLSearchParams({
      ruta: String(ruta),
    });

    const response = await fetch(
      `${config.apiUrl}/validacionaccesos/validarpantalla?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401) {
      return { authenticated: false, authorized: false };
    }

    if (response.status === 403) {
      return { authenticated: true, authorized: false };
    }

    if (!response.ok) {
      return { authenticated: true, authorized: false };
    }

    const data = await response.json();

    return {
      authenticated: true,
      authorized: data?.tienePermiso === true || data?.ok === true,
      permisos: data?.permisos ?? null,
      ruta: data?.ruta ?? ruta,
      codMenu: data?.codMenu ?? null,
      codTipoPermiso: data?.codTipoPermiso ?? null,
    };
  } catch {
    return { authenticated: true, authorized: false, permisos: null };
  }
}

export async function obtenerRutaAcceso({ ruta }) {
  const searchParams = new URLSearchParams({
    ruta: String(ruta),
  });

  const response = await fetch(
    `${config.apiUrl}/validacionaccesos/obtenerruta?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return await handleApiResponse(response, "No fue posible obtener la ruta.");
}

export async function validarPermiso({ ruta, codpermiso }) {
  try {
    const searchParams = new URLSearchParams({
      ruta: String(ruta),
      codpermiso: String(codpermiso),
    });

    const response = await fetch(
      `${config.apiUrl}/validacionaccesos/validarpermiso?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.status === 401) {
      return { authenticated: false, authorized: false };
    }

    if (!response.ok) {
      return { authenticated: true, authorized: false };
    }

    const data = await response.json();

    return {
      authenticated: true,
      authorized: data?.tienePermiso === true || data?.ok === true,
    };
  } catch {
    return { authenticated: true, authorized: false };
  }
}

export async function obtenerUsuario() {
  const response = await fetch(`${config.apiUrl}/home/ObtenerUsuario`, {
    method: "GET",
    credentials: "include",
  });

  const data = await handleApiResponse(response, "No fue posible obtener el usuario.");

  return data?.nombreusuario ?? "";
}

export async function logout() {
  try {
    await fetch(`${config.apiUrl}/login/salir`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    return false;
  }

  return true;
}
