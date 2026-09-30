import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vendorChunkGroups = [
  {
    name: "vendor-react",
    packages: [
      "/node_modules/react/",
      "/node_modules/react-dom/",
      "/node_modules/react-router/",
      "/node_modules/react-router-dom/",
      "/node_modules/scheduler/",
    ],
  },
  {
    name: "vendor-tanstack",
    packages: ["/node_modules/@tanstack/"],
  },
  {
    name: "vendor-i18n",
    packages: ["/node_modules/i18next/", "/node_modules/react-i18next/"],
  },
  {
    name: "vendor-radix",
    packages: ["/node_modules/radix-ui/", "/node_modules/@radix-ui/"],
  },
];

function manualChunks(id) {
  const normalizedId = id.replace(/\\/g, "/");

  if (!normalizedId.includes("/node_modules/")) {
    return undefined;
  }

  if (normalizedId.includes("/node_modules/exceljs/")) {
    return "vendor-excel";
  }

  if (normalizedId.includes("/node_modules/jspdf/") || normalizedId.includes("/node_modules/jspdf-autotable/")) {
    return "vendor-pdf";
  }

  if (normalizedId.includes("/node_modules/chart.js/") || normalizedId.includes("/node_modules/react-chartjs-2/")) {
    return "vendor-charts";
  }

  if (normalizedId.includes("/node_modules/@tiptap/") || normalizedId.includes("/node_modules/prosemirror-")) {
    return "vendor-editor";
  }

  const group = vendorChunkGroups.find((item) =>
    item.packages.some((packagePath) => normalizedId.includes(packagePath))
  );

  return group?.name ?? "vendor-misc";
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "lucide-react": path.resolve(__dirname, "./src/utils/tablerIconCompat.tsx"),
      },
    },
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, "cert/key.pem")),
        cert: fs.readFileSync(path.resolve(__dirname, "cert/cert.pem")),
      },
      port: 5001,
      strictPort: true,
    },
    build: {
      cssCodeSplit: true,
      cssMinify: true,
      emptyOutDir: true,
      minify: true,
      modulePreload: {
        resolveDependencies: (_filename, dependencies) =>
          dependencies.filter(
            (dependency) =>
              !["vendor-excel", "vendor-pdf", "vendor-charts", "vendor-editor"].some((chunk) =>
                dependency.includes(chunk)
              )
          ),
      },
      reportCompressedSize: false,
      sourcemap: false,
      rolldownOptions: {
        output: {
          manualChunks,
        },
      },
    },
  };
});
