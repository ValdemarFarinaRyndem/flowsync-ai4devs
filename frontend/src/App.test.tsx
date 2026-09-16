import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the counter starting at zero', () => {
    render(<App />)

    // Se busca por rol y nombre accesible, no por clase CSS: asi la prueba sigue
    // valiendo si cambia el maquetado, y falla si el boton deja de ser accesible.
    expect(screen.getByRole('button', { name: /count is 0/i })).toBeInTheDocument()
  })

  it('increments the counter on each click', async () => {
    const user = userEvent.setup()
    render(<App />)

    const counter = screen.getByRole('button', { name: /count is 0/i })
    await user.click(counter)

    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()
  })
})
