import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

type SettingsRuntimeApiSectionProps = {
  isElectron: boolean
  source: string
  apiBaseUrl: string
  cloudinarySignUrl: string
  userPath: string | null
  portablePath: string | null
  writtenPath: string | null
  isLoading: boolean
  isSaving: boolean
  isReloading: boolean
  isOpeningConfigFolder: boolean
  onApiBaseUrlChange: (value: string) => void
  onCloudinarySignUrlChange: (value: string) => void
  onReload: () => void
  onSave: () => void
  onOpenConfigFolder: () => void
}

const SOURCE_LABELS: Record<string, string> = {
  'build-env': 'Variables build (.env)',
  'local-storage': 'Navigateur (localStorage)',
  'user-file': 'Fichier utilisateur',
  'portable-file': 'Fichier portable',
  default: 'Valeurs par défaut',
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source || 'inconnu'
}

export function SettingsRuntimeApiSection({
  isElectron,
  source,
  apiBaseUrl,
  cloudinarySignUrl,
  userPath,
  portablePath,
  writtenPath,
  isLoading,
  isSaving,
  isReloading,
  isOpeningConfigFolder,
  onApiBaseUrlChange,
  onCloudinarySignUrlChange,
  onReload,
  onSave,
  onOpenConfigFolder,
}: SettingsRuntimeApiSectionProps) {
  const isBusy = isSaving || isLoading || isReloading || isOpeningConfigFolder

  return (
    <section className="mt-8 min-w-0 overflow-x-hidden sm:mt-10">
      <h3 className="font-medium">Configuration API (Super Admin)</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Modifiez l&apos;API backend consommée sans rebuild. Le frontend ajoute automatiquement le suffixe /api.
      </p>

      <div className="mt-4 min-w-0 space-y-3">
        <label className="block min-w-0 space-y-1.5">
          <span className="text-sm text-muted-foreground">URL API backend</span>
          <Input
            className="min-w-0"
            value={apiBaseUrl}
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
            placeholder="https://api.example.com"
            autoComplete="off"
          />
        </label>

        <label className="block min-w-0 space-y-1.5">
          <span className="text-sm text-muted-foreground">URL Cloudinary Sign (optionnel)</span>
          <Input
            className="min-w-0"
            value={cloudinarySignUrl}
            onChange={(event) => onCloudinarySignUrlChange(event.target.value)}
            placeholder="https://api.example.com/api/sign"
            autoComplete="off"
          />
        </label>

        <div className="min-w-0 space-y-2 rounded-lg border border-border bg-white/70 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Source active</span>
            <Badge variant="secondary">{sourceLabel(source)}</Badge>
          </div>
          {portablePath && (
            <p className="text-xs text-muted-foreground break-all">
              Chemin portable: <span className="font-mono">{portablePath}</span>
            </p>
          )}
          {userPath && (
            <p className="text-xs text-muted-foreground break-all">
              Chemin utilisateur: <span className="font-mono">{userPath}</span>
            </p>
          )}
          {writtenPath && (
            <p className="text-xs text-muted-foreground break-all">
              Dernière écriture: <span className="font-mono">{writtenPath}</span>
            </p>
          )}
          {!isElectron && (
            <p className="text-xs text-muted-foreground">
              Mode navigateur détecté: la configuration est sauvegardée localement dans ce navigateur.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button onClick={onSave} disabled={isBusy} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={onReload} disabled={isBusy} className="w-full sm:w-auto">
            {isReloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isReloading ? 'Rechargement...' : 'Recharger'}
          </Button>
          {isElectron && (
            <Button variant="secondary" onClick={onOpenConfigFolder} disabled={isBusy} className="w-full sm:w-auto">
              {isOpeningConfigFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isOpeningConfigFolder ? 'Ouverture...' : 'Ouvrir dossier config'}
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
