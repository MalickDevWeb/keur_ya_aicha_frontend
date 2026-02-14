import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLoginCard } from '../../common/AuthLoginCard'

export function AdminsLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ok = await login(username, password)
      if (!ok) {
        setError('Identifiants invalides')
        return
      }
      navigate('/pmt/admin/admins', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLoginCard
      title="Super Admin — Connexion"
      username={username}
      password={password}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  )
}
