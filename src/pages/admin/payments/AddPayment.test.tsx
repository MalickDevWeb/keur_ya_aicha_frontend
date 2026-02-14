import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import AddPayment from './AddPayment'

const navigate = vi.fn()

vi.mock('@/stores/dataStore', () => ({
  useStore: (selector: (state: { clients: unknown[] }) => unknown) =>
    selector({
      clients: [
        {
          id: 'client-1',
          firstName: 'Awa',
          lastName: 'Diop',
          phone: '771234567',
          rentals: [
            {
              id: 'rental-1',
              monthlyRent: 150000,
              payments: [{ id: 'payment-1', status: 'pending', amount: 150000 }],
            },
          ],
        },
      ],
    }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => ({}),
  }
})

describe('AddPayment page', () => {
  beforeEach(() => {
    navigate.mockClear()
  })

  it('shows client search results and allows selecting a client', () => {
    render(<AddPayment />)

    const search = screen.getByPlaceholderText(/Rechercher par nom, prénom ou téléphone/i)
    fireEvent.change(search, { target: { value: 'Awa' } })

    const clientButton = screen.getByRole('button', { name: /Awa Diop/i })
    fireEvent.click(clientButton)

    expect(screen.getAllByText(/Awa Diop/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/location\(s\)/i).length).toBeGreaterThan(0)
  })
})
