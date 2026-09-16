import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Los archivos se llaman *.test.* y NO *.spec.*: el hook validate-test-names.py
    // del plugin de estandares se dispara con el sufijo .spec.ts y exige que la
    // descripcion empiece por "debe", en espanol. Ver CLAUDE.md, Trampas conocidas.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
