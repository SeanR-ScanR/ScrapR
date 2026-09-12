import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main': resolve('src/main')
      }
    },
    build: {
      target: 'node24'
    }
  },
  preload: {
    build: {
      target: 'node24'
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@preload': resolve('src/preload')
      }
    }
  },
  renderer: {
    build: {
      target: 'es2024'
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@renderer': resolve('src/renderer/src'),
      }
    },
    plugins: [react()]
  }
});
