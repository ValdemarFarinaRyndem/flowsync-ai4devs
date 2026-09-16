import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './useAuth'

/**
 * Lo contrario de RequireAuth: login y registro no tienen sentido con la sesión
 * ya iniciada, así que mandan al perfil.
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return <p className="route-status">Cargando tu sesión…</p>
  }

  if (status === 'authenticated') {
    return <Navigate to="/profile" replace />
  }

  return children
}
