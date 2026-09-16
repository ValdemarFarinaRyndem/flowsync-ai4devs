import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'

/** Acceso a la sesión actual. Falla fuerte si el árbol no está dentro de AuthProvider. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value === null) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>')
  }
  return value
}
