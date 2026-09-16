// Registra los matchers de jest-dom en el `expect` de Vitest: toBeInTheDocument,
// toHaveTextContent y demas. Lo carga `setupFiles` en vite.config.ts.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom persiste entre pruebas dentro del mismo archivo. Sin esto, la segunda
// prueba que renderiza encuentra el arbol de la primera todavia montado.
afterEach(() => {
  cleanup()
})
