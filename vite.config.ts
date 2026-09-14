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
            const started = new Map<string, number>();
            proxy.on("proxyReq", (request) => {
              if (env.IVY_API_KEY) request.setHeader("X-API-Key", env.IVY_API_KEY);
              const key = `${request.method ?? "GET"} ${request.path}`;
              started.set(key, Date.now());
              console.log(`[proxy ${new Date().toISOString()}] request:start ${key}`);
            });
            proxy.on("proxyRes", (response, request) => {
              const key = `${request.method ?? "GET"} ${request.url ?? ""}`;
              const elapsed = started.get(key);
              console.log(`[proxy ${new Date().toISOString()}] request:end status=${response.statusCode} ${key}${elapsed ? ` durationMs=${Date.now() - elapsed}` : ""}`);
            });
            proxy.on("error", (error, request) => console.error(`[proxy ${new Date().toISOString()}] request:error ${request.method ?? "GET"} ${request.url ?? ""}: ${error.message}`));
          },
        },
      },
    },
  };
});