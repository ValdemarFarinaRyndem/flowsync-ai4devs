import { Navigate, Route, Routes } from 'react-router'
import { GuestOnly } from './auth/GuestOnly'
import { RequireAuth } from './auth/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import './App.css'

/**
 * Mapa de rutas. El perfil es el destino por defecto: si no hay sesión, el guarda
 * lo desvía a login, así que una URL desconocida siempre acaba en un sitio válido.
 */
function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/profile" replace />} />
    </Routes>
  )
}

export default App
