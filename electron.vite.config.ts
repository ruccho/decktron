import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {},
  preload: {
    build: {
      rolldownOptions: {
        input: {
          host: resolve(__dirname, 'src/preload/host.ts'),
          pane: resolve(__dirname, 'src/preload/pane.ts'),
        },
      },
    },
  },
  renderer: {
    plugins: [react()],
  },
});
