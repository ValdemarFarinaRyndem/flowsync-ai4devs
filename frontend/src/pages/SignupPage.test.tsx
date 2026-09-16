import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../auth/AuthProvider'

const PROFILE = {
  id: 2,
  fullName: 'Grace Hopper',
  email: 'grace@example.com',
  createdAt: '2026-02-01T00:00:00.000+00:00',
  updatedAt: '2026-02-01T00:00:00.000+00:00',
  initials: 'GH',
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, password = 'secret123') {
  await user.type(screen.getByLabelText('Nombre completo'), 'Grace Hopper')
  await user.type(screen.getByLabelText('Correo electrónico'), 'grace@example.com')
  await user.type(screen.getByLabelText('Contraseña'), password)
  await user.type(screen.getByLabelText('Repite la contraseña'), password)
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SignupPage', () => {
  it('creates the account, keeps the session open and lands on the profile', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { data: { user: PROFILE, token: 'oat_new' } }))
    vi.stubGlobal('fetch', fetchMock)

    renderSignup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('heading', { name: 'Grace Hopper' })).toBeInTheDocument()
    expect(window.localStorage.getItem('flowsync.token')).toBe('oat_new')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/auth/signup')
    expect(JSON.parse(init.body)).toEqual({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    })
  })

  it('refuses to submit when the two passwords do not match', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    renderSignup()
    await user.type(screen.getByLabelText('Nombre completo'), 'Grace Hopper')
    await user.type(screen.getByLabelText('Correo electrónico'), 'grace@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secret123')
    await user.type(screen.getByLabelText('Repite la contraseña'), 'otra-cosa')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Las dos contraseñas deben coincidir.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a password shorter than the backend accepts', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    renderSignup()
    await fillForm(user, 'corta')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('Debe tener al menos 8 caracteres.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the duplicated email next to its field, in Spanish', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          errors: [
            {
              message: 'The email has already been taken',
              rule: 'database.unique',
              field: 'email',
            },
          ],
        }),
      ),
    )

    renderSignup()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    const message = await screen.findAllByText(
      'Ese correo ya tiene una cuenta. Inicia sesión o usa otro.',
    )
    expect(message.length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true')
  })
})
