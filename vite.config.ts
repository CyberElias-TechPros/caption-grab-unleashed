import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { devApiPlugin } from "./vite/devApi";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: false,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  plugins: [
    react(),
    // `/api/*` → the real Worker when it is running, otherwise an offline demo
    // fallback so every UI path still works. Dev only; see vite/devApi.ts.
    devApiPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
