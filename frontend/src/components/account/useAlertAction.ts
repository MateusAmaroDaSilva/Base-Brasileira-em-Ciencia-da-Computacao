import { useState } from 'react'
import { createAlert } from '../../api/account'

/** Cria um alerta para a busca e lembra quais ja foram criados nesta tela. */
export function useAlertAction() {
  const [created, setCreated] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  async function add(query: string) {
    setError(null)
    try {
      await createAlert(query)
      setCreated((prev) => new Set(prev).add(query.toLowerCase()))
    } catch {
      setError('Não foi possível criar o alerta.')
    }
  }

  return { created, error, add, has: (query: string) => created.has(query.toLowerCase()) }
}
