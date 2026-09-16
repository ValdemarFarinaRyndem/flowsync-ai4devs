import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'

const PROFILE = {
  id: 1,
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2026-01-01T00:00:00.000+00:00',
  updatedAt: '2026-01-01T00:00:00.000+00:00',
  initials: 'AL',
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

/** Se monta la app entera para poder comprobar tambien la redireccion al perfil. */
function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('signs in with valid credentials and lands on the profile', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { data: { user: PROFILE, token: 'oat_new' } }))
    vi.stubGlobal('fetch', fetchMock)

    renderLogin()

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Tu perfil' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/login')
  })

  it('shows a single message in Spanish when the credentials are wrong', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse(400, { errors: [{ message: 'Invalid user credentials' }] })),
    )

    renderLogin()

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El correo o la contraseña no son correctos.',
    )
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
  })

  it('validates the form before calling the API', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    renderLogin()

    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-un-correo')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Escribe un correo electrónico válido.')).toBeInTheDocument()
    expect(screen.getByText('Este campo es obligatorio.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports that the server is unreachable instead of failing silently', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    renderLogin()

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo conectar/i)
  })
})
