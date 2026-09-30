export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
};

if (!config.apiUrl) {
  throw new Error("VITE_API_URL no esta configurada para el entorno actual.");
}
