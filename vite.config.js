import { defineConfig } from "vite";

export default defineConfig({
  server: { host: "0.0.0.0" },
  build: {
    rollupOptions: {
      input: {
        landing: "index.html",
        dashboard: "dashboard/index.html",
        architecture: "architecture/index.html",
      },
      output: {
        manualChunks(id) {
          if (id.includes("/three/")) return "three";
          if (/\/(gsap|lenis)\//.test(id)) return "animation";
        },
      },
    },
  },
});
