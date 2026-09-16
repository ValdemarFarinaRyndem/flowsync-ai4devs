import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../lib/api-client'
import {
  PASSWORD_MIN_LENGTH,
  compactErrors,
  validateEmail,
  validateNewPassword,
  validateRequired,
} from '../lib/form-validation'
import { FormField } from './FormField'

export function SignupPage() {
  const { signup } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = compactErrors({
      fullName: validateRequired(fullName),
      email: validateEmail(email),
      password: validateNewPassword(password),
      passwordConfirmation:
        password === passwordConfirmation ? undefined : 'Las dos contraseñas deben coincidir.',
    })
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length > 0) {
      return
    }

    setPending(true)
    try {
      // El API devuelve un access token junto con la cuenta recién creada, así que
      // la sesión queda iniciada y `GuestOnly` lleva sola al perfil.
      await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        passwordConfirmation,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors)
        // Si el error ya sale junto a su campo, repetirlo arriba solo hace ruido.
        setFormError(Object.keys(error.fieldErrors).length > 0 ? null : error.message)
      } else {
        setFormError('Ocurrió un error inesperado. Inténtalo de nuevo.')
      }
      setPending(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Crea tu cuenta</h1>
        <p className="auth-lead">Empieza a organizar el trabajo de tu equipo en FlowSync.</p>

        {formError !== null && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <FormField
          id="fullName"
          name="fullName"
          type="text"
          label="Nombre completo"
          autoComplete="name"
          value={fullName}
          error={fieldErrors.fullName}
          onChange={(event) => setFullName(event.target.value)}
        />

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
          hint={`Al menos ${PASSWORD_MIN_LENGTH} caracteres.`}
          autoComplete="new-password"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormField
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          label="Repite la contraseña"
          autoComplete="new-password"
          value={passwordConfirmation}
          error={fieldErrors.passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
        />

        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </button>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </main>
  )
}
