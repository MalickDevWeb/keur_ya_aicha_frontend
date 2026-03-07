import { useState } from 'react'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SettingsAccountSecuritySectionProps = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  onCurrentPasswordChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSave: () => void
  isSaving: boolean
  roleLabel: string
  isImpersonating: boolean
}

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function PasswordField({ id, label, value, onChange, placeholder }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pr-12"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Masquer ${label.toLowerCase()}` : `Afficher ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

export function SettingsAccountSecuritySection({
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSave,
  isSaving,
  roleLabel,
  isImpersonating,
}: SettingsAccountSecuritySectionProps) {
  return (
    <section className="mt-8 sm:mt-10">
      <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-4">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="font-medium">Sécurité du compte</h3>
          <p className="text-sm text-muted-foreground">
            Change le mot de passe du compte connecté <span className="font-semibold">{roleLabel}</span>. Le mot de
            passe actuel n’est jamais affiché ni prérempli.
          </p>
          {isImpersonating ? (
            <p className="text-xs text-amber-600">
              Cette action modifie ton compte connecté, pas celui de l’admin en cours d’impersonation.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <PasswordField
            id="current-password"
            label="Mot de passe actuel"
            value={currentPassword}
            onChange={onCurrentPasswordChange}
            placeholder="Saisir le mot de passe actuel"
          />
          <PasswordField
            id="new-password"
            label="Nouveau mot de passe"
            value={newPassword}
            onChange={onNewPasswordChange}
            placeholder="8 caractères minimum"
          />
          <PasswordField
            id="confirm-password"
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            placeholder="Répéter le nouveau mot de passe"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
            <p className="text-xs text-muted-foreground">Le mot de passe doit être différent de l’actuel.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
