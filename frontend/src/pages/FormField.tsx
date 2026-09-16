import type { InputHTMLAttributes } from 'react'

type FormFieldProps = {
  id: string
  label: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

/**
 * Un input con su etiqueta y su mensaje de error. El error se enlaza con
 * `aria-describedby` para que un lector de pantalla lo anuncie al enfocar el campo,
 * y `aria-invalid` lo marca sin depender del color.
 */
export function FormField({ id, label, error, ...inputProps }: FormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
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
