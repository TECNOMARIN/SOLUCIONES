import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { lookupPayjoyCustomer } from "./payjoy-service.js";

export default defineConfig({
base: '/SOLUCIONES/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "payjoy-api",
      configureServer(server) {
        server.middlewares.use("/api/payjoy/lookup", async (req, res) => {
          try {
            const url = new URL(req.url, "http://localhost");
            const tag = url.searchParams.get("tag");
            const result = await lookupPayjoyCustomer(tag);
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify(result));
          } catch(e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    strictPort: true,
    host: "0.0.0.0"
  }
});
