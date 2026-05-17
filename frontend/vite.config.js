import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
var frontendPort = Number(process.env.FRONTEND_PORT || 5180);
var apiPort = Number(process.env.API_PORT || 3187);
export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: frontendPort,
        strictPort: false,
        proxy: {
            "/api": {
                target: "http://localhost:".concat(apiPort),
                changeOrigin: true,
            },
        },
    },
});
