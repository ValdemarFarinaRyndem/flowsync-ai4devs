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
  createdAt: '2026-01-15T00:00:00.000+00:00',
  updatedAt: '2026-01-15T00:00:00.000+00:00',
  initials: 'AL',
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('flowsync.token', 'oat_stored')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ProfilePage', () => {
  it('shows the account data returned by the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { data: PROFILE })))

    renderProfile()

    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('falls back to the email when the account has no name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { data: { ...PROFILE, fullName: null } })),
    )

    renderProfile()

    expect(await screen.findByRole('heading', { name: 'ada@example.com' })).toBeInTheDocument()
    expect(screen.getByText('Sin nombre')).toBeInTheDocument()
  })

  it('logs out, drops the token and goes back to the login screen', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: PROFILE }))
      .mockResolvedValueOnce(jsonResponse(200, { message: 'Logged out successfully' }))
    vi.stubGlobal('fetch', fetchMock)

    renderProfile()
    await screen.findByRole('heading', { name: 'Ada Lovelace' })

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(window.localStorage.getItem('flowsync.token')).toBeNull()
    expect(fetchMock.mock.calls[1][0]).toContain('/account/logout')
  })

  it('sends a revoked token back to the login screen instead of showing an empty profile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(401, { errors: [{ message: 'Unauthorized access' }] })),
    )

    renderProfile()

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
  })
})
