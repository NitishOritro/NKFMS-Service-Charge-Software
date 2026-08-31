const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react.default ? react.default() : react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
