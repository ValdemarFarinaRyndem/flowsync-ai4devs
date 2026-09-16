import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

/**
 * Deja pasar solo a quien tiene sesión. Mientras se rehidrata el token guardado
 * no redirige: hacerlo mandaría a login a alguien que sí está autenticado cada vez
 * que refresca la página.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <p className="route-status">Cargando tu sesión…</p>
  }

  if (status === 'anonymous') {
    // `from` permite volver al destino original después de iniciar sesión.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
