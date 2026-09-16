/**
 * El backend responde en inglés y la interfaz está en español. La traducción vive
 * aquí, en la frontera con el API, para que las pantallas reciban texto ya listo
 * para mostrar. Se traduce por `rule`, que es estable, y no por el texto del
 * mensaje, que cambia con cualquier retoque de redacción del backend.
 */
type ErrorMeta = Record<string, unknown>

const BY_RULE: Record<string, (meta: ErrorMeta) => string> = {
  required: () => 'Este campo es obligatorio.',
  email: () => 'Escribe un correo electrónico válido.',
  'database.unique': () => 'Ese correo ya tiene una cuenta. Inicia sesión o usa otro.',
  minLength: (meta) => `Debe tener al menos ${meta.min} caracteres.`,
  maxLength: (meta) => `No puede tener más de ${meta.max} caracteres.`,
  sameAs: () => 'Las dos contraseñas deben coincidir.',
}

const BY_MESSAGE: Record<string, string> = {
  'Invalid user credentials': 'El correo o la contraseña no son correctos.',
  'Unauthorized access': 'Tu sesión expiró. Inicia sesión de nuevo.',
}

/** Traduce un error del API, o devuelve el original si no hay traducción para él. */
export function translateApiMessage(message: string, rule?: string, meta?: ErrorMeta): string {
  const byRule = rule === undefined ? undefined : BY_RULE[rule]
  if (byRule !== undefined) {
    return byRule(meta ?? {})
  }
  return BY_MESSAGE[message] ?? message
}
