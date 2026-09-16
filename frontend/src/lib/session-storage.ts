const TOKEN_KEY = 'flowsync.token'

// El token se guarda en localStorage para que la sesión sobreviva a un refresco
// de la página. El acceso va envuelto en try/catch porque en modo privado, o con
// el almacenamiento bloqueado, leer o escribir lanza.

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sin persistencia la sesión dura lo que dure la pestaña, que es preferible
    // a romper el inicio de sesión.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ver writeToken: no hay nada que hacer si el almacenamiento no está disponible.
  }
}
