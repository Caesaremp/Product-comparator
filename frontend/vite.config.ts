import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const frontendPort = Number(process.env.FRONTEND_PORT || 5180);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: frontendPort,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:3187",
        changeOrigin: true,
      },
    },
  },
});
