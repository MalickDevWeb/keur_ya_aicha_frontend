import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AddClient from './AddClient'
import { vi } from 'vitest'

const addClient = vi.fn(async (payload: Record<string, unknown>) => ({
  id: 'client-1',
  ...payload,
}))

vi.mock('@/stores/dataStore', () => ({
  useStore: (selector: (state: { addClient: typeof addClient; clients: [] }) => unknown) =>
    selector({ addClient, clients: [] }),
}))

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

function ensureCrypto() {
  if (!globalThis.crypto) {
    // @ts-expect-error test shim
    globalThis.crypto = { randomUUID: () => 'uuid-1' }
  }
}

describe('AddClient integration', () => {
  beforeEach(() => {
    addClient.mockClear()
    ensureCrypto()
  })

  it('submits valid form and calls addClient', async () => {
    render(<AddClient />)
    fireEvent.change(screen.getByLabelText(/clients\.name/i), { target: { value: 'Diop' } })
    fireEvent.change(screen.getByLabelText(/clients\.firstName/i), { target: { value: 'Awa' } })
    fireEvent.change(screen.getByLabelText(/clients\.phone/i), { target: { value: '771234567' } })
    fireEvent.change(screen.getByLabelText(/clients\.cni/i), { target: { value: '1234567890123' } })
    fireEvent.change(
      screen.getByLabelText((text) => text === 'addClient.property'),
      { target: { value: 'Villa #2' } }
    )

    fireEvent.click(screen.getByRole('button', { name: /addClient\.submit/i }))

    await waitFor(() => expect(addClient).toHaveBeenCalledTimes(1))
  })
})
