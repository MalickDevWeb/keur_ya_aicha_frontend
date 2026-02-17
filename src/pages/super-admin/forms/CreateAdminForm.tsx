import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createAdmin } from '@/services/api'
import type { AdminDTO, EntrepriseDTO } from '@/dto/backend/responses'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FormError } from '@/components/FormError'

interface CreateAdminFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (admin: AdminDTO) => void
  entreprises: EntrepriseDTO[]
}

/**
 * Form for creating new admin
 * Extracted from SuperAdminDashboard to reduce component size
 */
export function CreateAdminForm({
  open,
  onOpenChange,
  onSuccess,
  entreprises,
}: CreateAdminFormProps) {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    entreprise: '',
    password: '',
    phone: '',
  })

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.password) {
      setError('Nom et mot de passe requis')
      return
    }

    setCreating(true)
    try {
      const generatedUsername =
        formData.phone?.trim() ||
        formData.name.trim().toLowerCase().replace(/\s+/g, '') ||
        `admin-${Date.now().toString(36)}`
      const newAdmin = await createAdmin({
        username: generatedUsername,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        entreprise: formData.entreprise || undefined,
      })

      onSuccess(newAdmin)
      setFormData({
        name: '',
        email: '',
        entreprise: '',
        password: '',
        phone: '',
      })
      onOpenChange(false)
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Erreur lors de la création'
      const message = raw.includes(':') ? raw.split(':').slice(-1)[0].trim() : raw
      setError(message)
    } finally {
      setCreating(false)
    }
  }, [formData, onSuccess, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un Admin</DialogTitle>
        </DialogHeader>

        {error && <FormError message={error} />}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
        >
          <Input
            autoComplete="name"
            placeholder="Nom complet"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
          <Input
            autoComplete="email"
            placeholder="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          <Input
            autoComplete="tel"
            placeholder="Téléphone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          <Input
            autoComplete="new-password"
            placeholder="Mot de passe"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
          />
          <select
            className="w-full px-3 py-2 border rounded-md"
            value={formData.entreprise}
            onChange={(e) => handleChange('entreprise', e.target.value)}
          >
            <option value="">Sélectionner une entreprise (optionnel)</option>
            {entreprises.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.name}
              </option>
            ))}
          </select>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Annuler
            </Button>
            <Button type="submit" loading={creating}>
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
