import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.IVY_API_BASE_URL || "https://solve.ivy.homes",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (request) => {
              if (env.IVY_API_KEY) request.setHeader("X-API-Key", env.IVY_API_KEY);
            });
          },
        },
      },
    },
  };
});