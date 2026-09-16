/**
 * Validación en el cliente que refleja las reglas de `backend/app/validators/user.ts`.
 * No sustituye a la del servidor —esa es la que manda—, pero evita un viaje de ida
 * y vuelta para errores que se ven a simple vista.
 */

/** Espejo laxo del formato de correo: rechaza lo obvio sin inventar reglas propias. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 32

export function validateRequired(value: string): string | undefined {
  return value.trim() === '' ? 'Este campo es obligatorio.' : undefined
}

export function validateEmail(value: string): string | undefined {
  const required = validateRequired(value)
  if (required !== undefined) {
    return required
  }
  return EMAIL_PATTERN.test(value.trim()) ? undefined : 'Escribe un correo electrónico válido.'
}

export function validateNewPassword(value: string): string | undefined {
  const required = validateRequired(value)
  if (required !== undefined) {
    return required
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `No puede tener más de ${PASSWORD_MAX_LENGTH} caracteres.`
  }
  return undefined
}

/** Quita las claves sin error para poder preguntar por el tamaño del objeto. */
export function compactErrors(errors: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
}
