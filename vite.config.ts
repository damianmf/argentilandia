import { defineConfig } from 'vite';

// Solo desarrollo: el /api lo sirve `npx wrangler dev` en 8787 (misma Worker
// que producción, con D1 local). En producción el Worker propio lo sirve.
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
