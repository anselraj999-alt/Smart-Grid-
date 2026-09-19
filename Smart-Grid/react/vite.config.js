import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, calls to /api/... are forwarded to the backend, so the browser
    // sees one origin and no CORS setup is needed. Start the backend with `npm start`.
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
