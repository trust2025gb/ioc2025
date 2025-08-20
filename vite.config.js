import { defineConfig } from 'vite';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProd ? '/mobile/' : '/',
  server: {
    port: 3000,
    open: false
  }
});
