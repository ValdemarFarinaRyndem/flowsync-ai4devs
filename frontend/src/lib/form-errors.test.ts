import { describe, expect, it } from 'vitest'
import { ApiError } from './api-client'
import { toFormErrors } from './form-errors'

describe('toFormErrors', () => {
  it('leaves the errors on their fields and does not repeat them at the top', () => {
    const error = new ApiError(422, 'Ese correo ya tiene una cuenta.', {
      email: 'Ese correo ya tiene una cuenta.',
    })

    expect(toFormErrors(error)).toEqual({
      fieldErrors: { email: 'Ese correo ya tiene una cuenta.' },
      formError: null,
    })
  })

  it('shows the message at the top when it belongs to no field', () => {
    const error = new ApiError(400, 'El correo o la contraseña no son correctos.')

    expect(toFormErrors(error)).toEqual({
      fieldErrors: {},
      formError: 'El correo o la contraseña no son correctos.',
    })
  })

  it('falls back to a generic message for anything that is not an ApiError', () => {
    expect(toFormErrors(new TypeError('boom'))).toEqual({
      fieldErrors: {},
      formError: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    })
  })
})
