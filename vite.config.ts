import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: base='/'  |  GitHub Pages (prod): base='/rockstar/'
// Build output gaat naar /docs zodat Pages kan deployen vanaf de docs-map.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/rockstar/' : '/',
  build: { outDir: 'docs' }
}))
