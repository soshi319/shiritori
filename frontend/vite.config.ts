import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// __dirname の代わりを定義
const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // path.resolve を使わずに、直接パスを指定する形にします
      shared: resolve(__dirname, "../shared"),
    },
  },
});
