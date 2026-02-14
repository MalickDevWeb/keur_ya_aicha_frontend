import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import LoginPage from './Login'

const login = vi.fn(async () => true)
const addToast = vi.fn()
const navigate = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login,
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
  }),
}))

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    addToast,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('Login page', () => {
  beforeEach(() => {
    login.mockClear()
    addToast.mockClear()
    navigate.mockClear()
  })

  it('submits credentials and navigates on success', async () => {
    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('+221 77 123 45 67'), { target: { value: '771234567' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin123' } })

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

    await waitFor(() => expect(login).toHaveBeenCalledWith('771234567', 'admin123'))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true }))
  })

  it('shows error on invalid login', async () => {
    login.mockResolvedValueOnce(false)
    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('+221 77 123 45 67'), { target: { value: '770000000' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'bad' } })

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

    await waitFor(() => expect(screen.getByText(/Identifiants invalides/i)).toBeInTheDocument())
  })
})
