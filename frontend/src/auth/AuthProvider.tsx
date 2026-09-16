import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../lib/auth-api'
import type { LoginInput, SignupInput, User } from '../lib/auth-api'
import { clearToken, readToken, writeToken } from '../lib/session-storage'
import { AuthContext, type AuthStatus, type AuthContextValue } from './auth-context'

/**
 * Mantiene la sesión: el token persistido y el usuario que le corresponde.
 * Al montar rehidrata el token guardado contra `GET /account/profile`, de modo que
 * un token caducado o revocado no deja la app creyendo que hay sesión.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readToken())
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (readToken() ? 'loading' : 'anonymous'))

  useEffect(() => {
    if (status !== 'loading' || token === null) {
      return
    }

    let active = true
    authApi
      .fetchProfile(token)
      .then((profile) => {
        if (!active) return
        setUser(profile)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!active) return
        clearToken()
        setToken(null)
        setUser(null)
        setStatus('anonymous')
      })

    // StrictMode monta dos veces en desarrollo: la bandera evita que la respuesta
    // del primer montaje escriba estado sobre el segundo.
    return () => {
      active = false
    }
  }, [status, token])

  const startSession = useCallback((result: authApi.AuthResult) => {
    writeToken(result.token)
    setToken(result.token)
    setUser(result.user)
    setStatus('authenticated')
  }, [])

  const login = useCallback(
    async (input: LoginInput) => {
      startSession(await authApi.login(input))
    },
    [startSession],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      startSession(await authApi.signup(input))
    },
    [startSession],
  )

  const logout = useCallback(async () => {
    if (token !== null) {
      // Si la llamada falla el token ya no sirve de todas formas: la sesión local
      // se cierra igual para no dejar a la persona atrapada dentro.
      await authApi.logout(token).catch(() => undefined)
    }
    clearToken()
    setToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, signup, logout }),
    [status, user, login, signup, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
