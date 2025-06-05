import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures correct asset paths in Electron build
  build: {
    outDir: 'dist', // Output directory relative to renderer folder
  },
  server: {
    port: 5173, // Port for Vite dev server, matching main.js
  },
});
