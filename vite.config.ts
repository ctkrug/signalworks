import { defineConfig } from "vite";

// Relative base so the build can be hosted from any subpath
// (e.g. apps.charliekrug.com/signalworks) without absolute-path asset breakage.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
});
