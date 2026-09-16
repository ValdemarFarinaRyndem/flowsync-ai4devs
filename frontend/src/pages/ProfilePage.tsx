import { useAuth } from '../auth/useAuth'

export function ProfilePage() {
  const { user } = useAuth()

  return (
    <main className="profile-page">
      <h1>Tu perfil</h1>
      <p>{user?.email}</p>
    </main>
  )
}
