import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App routes', () => {
  it('sends an anonymous visitor from the profile to the login screen', async () => {
    renderAt('/profile')

    // Se busca por rol y nombre accesible, no por clase CSS: asi la prueba sigue
    // valiendo si cambia el maquetado.
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
  })

  it('sends an unknown route to the profile, and from there to login', async () => {
    renderAt('/una-ruta-que-no-existe')

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
  })

  it('keeps an authenticated visitor away from the login screen', async () => {
    window.localStorage.setItem('flowsync.token', 'oat_stored')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              id: 1,
              fullName: 'Ada Lovelace',
              email: 'ada@example.com',
              createdAt: '2026-01-01T00:00:00.000+00:00',
              updatedAt: '2026-01-01T00:00:00.000+00:00',
              initials: 'AL',
            },
          }),
          { status: 200 },
        ),
      ),
    )

    renderAt('/login')

    expect(await screen.findByRole('heading', { name: 'Tu perfil' })).toBeInTheDocument()
  })
})
