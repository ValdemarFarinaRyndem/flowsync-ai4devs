import type { InputHTMLAttributes } from 'react'

type FormFieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

/**
 * Un input con su etiqueta, su pista y su mensaje de error. Ambos textos se enlazan
 * con `aria-describedby` para que un lector de pantalla los anuncie al enfocar el
 * campo, y `aria-invalid` marca el error sin depender del color. Con error, la
 * pista desaparece: el mensaje ya dice lo mismo y en concreto.
 */
export function FormField({ id, label, hint, error, ...inputProps }: FormFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const showHint = hint !== undefined && error === undefined

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {showHint && (
        <p className="form-hint" id={hintId}>
          {hint}
        </p>
      )}
      <input
        id={id}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? (showHint ? hintId : undefined) : errorId}
        {...inputProps}
      />
      {error !== undefined && (
        <p className="form-field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}
