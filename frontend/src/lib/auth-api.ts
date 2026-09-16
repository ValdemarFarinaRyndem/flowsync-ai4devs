import { apiRequest } from './api-client'

/** Usuario tal como lo serializa `UserTransformer` en el backend. */
export type User = {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string
  initials: string
}

/** Respuesta de signup y login: el usuario creado/autenticado y su access token. */
export type AuthResult = {
  user: User
  token: string
}

export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
}

export function login(input: LoginInput): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', { method: 'POST', body: input })
}

export function signup(input: SignupInput): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/signup', { method: 'POST', body: input })
}

export function fetchProfile(token: string): Promise<User> {
  return apiRequest<User>('/account/profile', { token })
}

export function logout(token: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/account/logout', { method: 'POST', token })
}
