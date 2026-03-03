// vite.config.ts
import { defineConfig } from "file:///D:/Perfect_Security_Solution/perfectsecuritysolutionadmin-main/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Perfect_Security_Solution/perfectsecuritysolutionadmin-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/Perfect_Security_Solution/perfectsecuritysolutionadmin-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\Perfect_Security_Solution\\perfectsecuritysolutionadmin-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/otp": {
        target: "https://script.google.com",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(
          "/api/otp",
          "/macros/s/AKfycbwbbj3rVFst1XjH1IS-dGkEuwIZNDH59a2kHYXSZxeZ1E3h5OOodNB6xvBMEVQj5jGQ/exec"
        )
      },
      "/api/products": {
        target: "https://script.google.com",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(
          "/api/products",
          "/macros/s/AKfycby3Hy5QrBbYzvvzhGhi5yynq0vbLkssdvZOZuzg2eTVSiyYAjVGcfmpMeTexfAQ_cUs/exec"
        )
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQZXJmZWN0X1NlY3VyaXR5X1NvbHV0aW9uXFxcXHBlcmZlY3RzZWN1cml0eXNvbHV0aW9uYWRtaW4tbWFpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcUGVyZmVjdF9TZWN1cml0eV9Tb2x1dGlvblxcXFxwZXJmZWN0c2VjdXJpdHlzb2x1dGlvbmFkbWluLW1haW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1BlcmZlY3RfU2VjdXJpdHlfU29sdXRpb24vcGVyZmVjdHNlY3VyaXR5c29sdXRpb25hZG1pbi1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcblxuICAgIHByb3h5OiB7XG4gICAgICBcIi9hcGkvb3RwXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHBzOi8vc2NyaXB0Lmdvb2dsZS5jb21cIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT5cbiAgICAgICAgICBwYXRoLnJlcGxhY2UoXG4gICAgICAgICAgICBcIi9hcGkvb3RwXCIsXG4gICAgICAgICAgICBcIi9tYWNyb3Mvcy9BS2Z5Y2J3YmJqM3JWRnN0MVhqSDFJUy1kR2tFdXdJWk5ESDU5YTJrSFlYU1p4ZVoxRTNoNU9Pb2ROQjZ4dkJNRVZRajVqR1EvZXhlY1wiXG4gICAgICAgICAgKSxcbiAgICAgIH0sXG5cbiAgICAgIFwiL2FwaS9wcm9kdWN0c1wiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwczovL3NjcmlwdC5nb29nbGUuY29tXCIsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+XG4gICAgICAgICAgcGF0aC5yZXBsYWNlKFxuICAgICAgICAgICAgXCIvYXBpL3Byb2R1Y3RzXCIsXG4gICAgICAgICAgICBcIi9tYWNyb3Mvcy9BS2Z5Y2J5M0h5NVFyQmJZenZ2emhHaGk1eXlucTB2Ykxrc3NkdlpPWnV6ZzJlVFZTaXlZQWpWR2NmbXBNZVRleGZBUV9jVXMvZXhlY1wiXG4gICAgICAgICAgKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcblxuICBwbHVnaW5zOiBbcmVhY3QoKSwgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1gsU0FBUyxvQkFBb0I7QUFDL1ksT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUVOLE9BQU87QUFBQSxNQUNMLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQ0EsVUFDUkEsTUFBSztBQUFBLFVBQ0g7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0o7QUFBQSxNQUVBLGlCQUFpQjtBQUFBLFFBQ2YsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDQSxVQUNSQSxNQUFLO0FBQUEsVUFDSDtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDSjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDOUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
