import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

export function ProfilePage() {
  const { user, logout } = useAuth()
  const [pending, setPending] = useState(false)

  // RequireAuth ya garantiza que hay sesión; esto solo satisface al tipo.
  if (user === null) {
    return null
  }

  async function handleLogout() {
    setPending(true)
    // No hace falta navegar: al quedar la sesión anónima, RequireAuth desvía a
    // /login por sí solo, que es el mismo camino que sigue un token caducado.
    await logout()
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <p className="profile-avatar" aria-hidden="true">
          {user.initials}
        </p>

        <h1>{user.fullName ?? user.email}</h1>
        <p className="profile-lead">Esta es la información de tu cuenta.</p>

        <dl className="profile-details">
          <dt>Nombre</dt>
          <dd>{user.fullName ?? 'Sin nombre'}</dd>

          <dt>Correo electrónico</dt>
          <dd>{user.email}</dd>

          <dt>Miembro desde</dt>
          <dd>{DATE_FORMAT.format(new Date(user.createdAt))}</dd>
        </dl>

        <button
          type="button"
          className="secondary-button"
          disabled={pending}
          onClick={() => void handleLogout()}
        >
          {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </section>
    </main>
  )
}
