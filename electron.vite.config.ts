import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      target: 'node24'
    }
  },
  preload: {
    build: {
      target: 'node24'
    }
  },
  renderer: {
    build: {
      target: 'es2024'
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
});
