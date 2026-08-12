import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative asset URLs work in both an Electron file:// bundle and a deployed web site.
export default defineConfig({
  base: './',
  plugins: [react()],
});
