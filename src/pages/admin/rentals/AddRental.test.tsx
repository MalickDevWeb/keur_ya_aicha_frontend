import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import AddRental from './AddRental'

const addRental = vi.fn(async () => true)

vi.mock('@/stores/dataStore', () => ({
  useStore: (selector: (state: { clients: unknown[]; addRental: typeof addRental }) => unknown) =>
    selector({
      clients: [{ id: 'client-1', firstName: 'Awa', lastName: 'Diop', phone: '771234567' }],
      addRental,
    }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ clientId: 'client-1' }),
  }
})

describe('AddRental integration', () => {
  beforeEach(() => {
    addRental.mockClear()
  })

  it('submits valid form and calls addRental', async () => {
    render(<AddRental />)
    fireEvent.change(screen.getByLabelText(/Nom du bien/i), { target: { value: 'Appartement A3' } })
    fireEvent.change(screen.getByLabelText(/Loyer mensuel/i), { target: { value: '150000' } })
    fireEvent.change(screen.getByLabelText(/Montant total/i), { target: { value: '200000' } })

    fireEvent.click(screen.getByRole('button', { name: /créer la location/i }))

    await waitFor(() => expect(addRental).toHaveBeenCalledTimes(1))
  })
})
