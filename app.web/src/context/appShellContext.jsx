import { createContext, useContext } from "react";

export const AppShellContext = createContext(null);

export function useAppShell() {
  const context = useContext(AppShellContext);

  if (!context) {
    throw new Error("useAppShell debe usarse dentro de AppShellContext.");
  }

  return context;
}
