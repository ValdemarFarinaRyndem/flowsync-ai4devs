import { createContext } from 'react'
import type { LoginInput, SignupInput, User } from '../lib/auth-api'

/**
 * `loading` solo dura mientras se rehidrata la sesión guardada al arrancar la app.
 * Las rutas protegidas esperan a que salga de ahí antes de decidir si redirigen.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  status: AuthStatus
  user: User | null
  login: (input: LoginInput) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
