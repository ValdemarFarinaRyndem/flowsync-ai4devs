// El backend corre en otro puerto que el dev server de Vite. VITE_API_URL permite
// apuntar a otro host sin tocar código; el valor por defecto es el que levanta
// `npm run dev` dentro de backend/.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

/** Cada entrada del arreglo `errors` que devuelve el backend (VineJS o excepción). */
type ApiErrorItem = {
  message: string
  field?: string
  rule?: string
}

/** Mensajes de respaldo para cuando el backend no manda un `errors` utilizable. */
const FALLBACK_MESSAGES: Record<number, string> = {
  401: 'Tu sesión expiró. Inicia sesión de nuevo.',
  404: 'No encontramos lo que buscabas.',
  500: 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.',
}

const GENERIC_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.'

/**
 * Error de una llamada al API. `fieldErrors` queda poblado cuando el backend
 * responde con errores de validación, indexado por el nombre del campo, para que
 * un formulario pueda pintarlos junto a su input.
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

/**
 * Hace una llamada al API y devuelve el cuerpo ya desenvuelto. Las respuestas con
 * contenido vienen dentro de `data`; logout responde `{ message }` sin envolver.
 * Cualquier respuesta no exitosa se convierte en `ApiError`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // fetch solo rechaza por fallo de red o CORS: un 4xx/5xx llega como respuesta.
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo.')
  }

  const payload = await readJson(response)

  if (!response.ok) {
    throw toApiError(response.status, payload)
  }

  return (isRecord(payload) && 'data' in payload ? payload.data : payload) as T
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text === '') {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    // Un proxy o un error sin manejar pueden devolver HTML en lugar de JSON.
    return null
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  const items =
    isRecord(payload) && Array.isArray(payload.errors) ? (payload.errors as ApiErrorItem[]) : []

  const fieldErrors: Record<string, string> = {}
  for (const item of items) {
    // Se queda el primer mensaje de cada campo: es el que describe la causa raíz.
    if (item.field && !(item.field in fieldErrors)) {
      fieldErrors[item.field] = item.message
    }
  }

  const message = items[0]?.message ?? FALLBACK_MESSAGES[status] ?? GENERIC_MESSAGE
  return new ApiError(status, message, fieldErrors)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
