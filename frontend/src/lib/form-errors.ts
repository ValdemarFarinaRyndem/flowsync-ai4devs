import { ApiError } from './api-client'

type FormErrors = {
  fieldErrors: Record<string, string>
  formError: string | null
}

/**
 * Reparte un error de envío entre los campos y el aviso general del formulario.
 * Lo comparten login y registro: separarlo evita que el manejo de errores de las
 * dos pantallas se vaya divergiendo sin que nada lo note.
 */
export function toFormErrors(error: unknown): FormErrors {
  if (error instanceof ApiError) {
    return {
      fieldErrors: error.fieldErrors,
      // Si el error ya aparece junto a su campo, repetirlo arriba solo hace ruido.
      formError: Object.keys(error.fieldErrors).length > 0 ? null : error.message,
    }
  }

  return {
    fieldErrors: {},
    formError: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
  }
}
