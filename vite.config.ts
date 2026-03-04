import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,

    proxy: {
      "/api/otp": {
        target: "https://script.google.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            "/api/otp",
            "/macros/s/AKfycbzyW_o-hoPN9yGBPljinl0ReLntfeS369xO_Rt--y1NKkgi2XL1xMwhLz-CkTfxM4PC/exec"
          ),
      },

      "/api/products": {
        target: "https://script.google.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            "/api/products",
            "/macros/s/AKfycbwkgqmaoa2NsL-PA2H0IB6DZymOoHrLRum_8_25pJmAp31F_ohvhBPeZi7sk8B3FOXX/exec"
          ),
      },
    },
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
