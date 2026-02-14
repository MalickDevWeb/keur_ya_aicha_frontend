import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type AuthLoginCardProps = {
  title: string
  username: string
  password: string
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  loading?: boolean
  error?: string
  usernameLabel?: string
  passwordLabel?: string
  usernamePlaceholder?: string
  passwordPlaceholder?: string
  submitLabel?: string
}

export function AuthLoginCard({
  title,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  loading = false,
  error = '',
  usernameLabel = 'Identifiant',
  passwordLabel = 'Mot de passe',
  usernamePlaceholder = 'superadmin',
  passwordPlaceholder = '••••••••',
  submitLabel = 'Se connecter',
}: AuthLoginCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950/5 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium">{usernameLabel}</label>
              <Input
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                placeholder={usernamePlaceholder}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{passwordLabel}</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder={passwordPlaceholder}
              />
            </div>
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Connexion...' : submitLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
