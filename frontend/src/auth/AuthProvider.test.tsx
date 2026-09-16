import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

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

/** Sonda mínima: expone el estado de la sesión como texto y dispara sus acciones. */
function SessionProbe() {
  const { status, user, login, logout } = useAuth()

  return (
    <>
      <p>status: {status}</p>
      <p>user: {user?.email ?? 'none'}</p>
      <button type="button" onClick={() => void login({ email: 'ada@example.com', password: 'x' })}>
        Entrar
      </button>
      <button type="button" onClick={() => void logout()}>
        Salir
      </button>
    </>
  )
}

function renderProbe() {
  return render(
    <AuthProvider>
      <SessionProbe />
    </AuthProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AuthProvider', () => {
  it('starts anonymous when there is no stored token', async () => {
    vi.stubGlobal('fetch', vi.fn())

    renderProbe()

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
  })

  it('restores the session from the stored token', async () => {
    window.localStorage.setItem('flowsync.token', 'oat_stored')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: PROFILE }))
    vi.stubGlobal('fetch', fetchMock)

    renderProbe()

    expect(await screen.findByText('status: authenticated')).toBeInTheDocument()
    expect(screen.getByText('user: ada@example.com')).toBeInTheDocument()
  })

  it('drops a stored token the API no longer accepts', async () => {
    window.localStorage.setItem('flowsync.token', 'oat_expired')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(401, { errors: [{ message: 'Unauthorized access' }] })),
    )

    renderProbe()

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
    expect(window.localStorage.getItem('flowsync.token')).toBeNull()
  })

  it('persists the token after a successful login and clears it on logout', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(200, { data: { user: PROFILE, token: 'oat_new' } }))
        .mockResolvedValueOnce(jsonResponse(200, { message: 'Logged out successfully' })),
    )

    renderProbe()
    await screen.findByText('status: anonymous')

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('status: authenticated')).toBeInTheDocument()
    expect(window.localStorage.getItem('flowsync.token')).toBe('oat_new')

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(await screen.findByText('status: anonymous')).toBeInTheDocument()
    expect(window.localStorage.getItem('flowsync.token')).toBeNull()
  })
})
