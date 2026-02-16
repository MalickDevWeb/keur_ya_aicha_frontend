import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  onApiBaseUrlChange,
  onCloudinarySignUrlChange,
  onReload,
  onSave,
  onOpenConfigFolder,
}: SettingsRuntimeApiSectionProps) {
  return (
    <section className="mt-10">
      <h3 className="font-medium">Configuration API (Super Admin)</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Modifiez l&apos;API backend consommée sans rebuild. Cette configuration est prioritaire au runtime.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">URL API backend</span>
          <Input
            value={apiBaseUrl}
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
            placeholder="https://api.example.com"
            autoComplete="off"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">URL Cloudinary Sign (optionnel)</span>
          <Input
            value={cloudinarySignUrl}
            onChange={(event) => onCloudinarySignUrlChange(event.target.value)}
            placeholder="https://api.example.com/sign"
            autoComplete="off"
          />
        </label>

        <div className="rounded-lg border border-border bg-white/70 px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
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

        <div className="flex gap-2 flex-wrap">
          <Button onClick={onSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button variant="outline" onClick={onReload} disabled={isSaving || isLoading}>
            Recharger
          </Button>
          {isElectron && (
            <Button variant="secondary" onClick={onOpenConfigFolder}>
              Ouvrir dossier config
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
