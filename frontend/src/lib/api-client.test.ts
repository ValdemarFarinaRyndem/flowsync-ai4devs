import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, API_BASE_URL, apiRequest } from './api-client'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status })
}

/** Ejecuta una llamada que debe fallar y devuelve el ApiError ya tipado. */
async function captureApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiError) {
      return error
    }
    throw error
  }
  throw new Error('Se esperaba que la llamada al API fallara')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('unwraps the data envelope returned by the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { data: { id: 1 } })))

    await expect(apiRequest('/account/profile')).resolves.toEqual({ id: 1 })
  })

  it('returns the raw body when there is no data envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { message: 'ok' })))

    await expect(apiRequest('/account/logout', { method: 'POST' })).resolves.toEqual({
      message: 'ok',
    })
  })

  it('sends the bearer token and the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: null }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@b.c' }, token: 'oat_1' })

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer oat_1',
      },
      body: '{"email":"a@b.c"}',
    })
  })

  it('turns validation errors into an ApiError indexed by field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          errors: [
            { message: 'The email has already been taken', field: 'email' },
            { message: 'The password field must have at least 8 characters', field: 'password' },
          ],
        }),
      ),
    )

    const error = await captureApiError(apiRequest('/auth/signup', { method: 'POST', body: {} }))

    expect(error.status).toBe(422)
    expect(error.message).toBe('The email has already been taken')
    expect(error.fieldErrors).toEqual({
      email: 'The email has already been taken',
      password: 'The password field must have at least 8 characters',
    })
  })

  it('reports a connection problem when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await captureApiError(apiRequest('/auth/login', { method: 'POST' }))

    expect(error.status).toBe(0)
    expect(error.message).toMatch(/no se pudo conectar/i)
  })

  it('falls back to a readable message when the error body is not usable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>oops</html>', { status: 500 })))

    const error = await captureApiError(apiRequest('/account/profile'))

    expect(error.message).toMatch(/servidor/i)
  })
})
