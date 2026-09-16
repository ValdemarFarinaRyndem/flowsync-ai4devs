import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../lib/api-client'
import { compactErrors, validateEmail, validateRequired } from '../lib/form-validation'
import { FormField } from './FormField'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = compactErrors({
      email: validateEmail(email),
      // En login no se valida el largo: una cuenta vieja podría tener otra regla,
      // y quien decide es el backend.
      password: validateRequired(password),
    })
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length > 0) {
      return
    }

    setPending(true)
    try {
      await login({ email: email.trim(), password })
      // Vuelve al destino que pidió antes de que el guarda lo mandara aquí.
      const from = typeof location.state?.from === 'string' ? location.state.from : '/profile'
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors)
        setFormError(error.message)
      } else {
        setFormError('Ocurrió un error inesperado. Inténtalo de nuevo.')
      }
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Inicia sesión</h1>
        <p className="auth-lead">Entra a FlowSync con tu cuenta.</p>

        {formError !== null && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <FormField
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="auth-footer">
          ¿Todavía no tienes cuenta? <Link to="/signup">Crea una</Link>
        </p>
      </form>
    </main>
  )
}
