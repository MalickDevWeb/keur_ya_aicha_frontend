import { Button } from '@/components/ui/button'
import { AVAILABLE_THEMES } from '../constants'

type SettingsThemeSectionProps = {
  persistedTheme: string
  selectedTheme: string
  previewTheme: string
  onSelectTheme: (key: string) => void
  onReset: () => void
  onApply: () => void
  onCancelPreview: () => void
}

export function SettingsThemeSection({
  persistedTheme,
  selectedTheme,
  previewTheme,
  onSelectTheme,
  onReset,
  onApply,
  onCancelPreview,
}: SettingsThemeSectionProps) {
  const effectiveTheme = previewTheme || persistedTheme

  return (
    <section className="mt-6">
      <h3 className="font-medium">Palette</h3>
      <p className="text-sm text-muted-foreground mt-2">Palette actuelle: {persistedTheme || 'Par défaut'}</p>

      <div className="flex gap-3 flex-wrap mt-3 items-center">
        {AVAILABLE_THEMES.map((theme) => (
          <div key={theme.key || 'default'} className="flex items-center gap-2">
            <Button variant={selectedTheme === theme.key ? 'secondary' : 'ghost'} onClick={() => onSelectTheme(theme.key)}>
              {theme.label}
            </Button>
          </div>
        ))}

        <Button variant="outline" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>

      <div className="mt-4 flex gap-2 items-center">
        <Button onClick={onApply} disabled={selectedTheme === persistedTheme}>
          Appliquer la palette
        </Button>
        <Button variant="ghost" onClick={onCancelPreview}>
          Annuler l'aperçu
        </Button>
      </div>

      <div className="mt-6">
        <h4 className="font-medium">Aperçu</h4>
        <div className="mt-3 p-4 rounded-md border" aria-live="polite">
          <div className={effectiveTheme || ''}>
            <div className="p-4 rounded-md bg-card">
              <h5 className="text-lg font-semibold">Titre d'exemple</h5>
              <p className="text-sm mt-2">Texte d'exemple — couleurs et surfaces</p>
              <div className="mt-3 flex gap-2">
                <div className="w-12 h-8 rounded" style={{ background: 'hsl(var(--primary))' }} />
                <div className="w-12 h-8 rounded" style={{ background: 'hsl(var(--accent))' }} />
                <div className="w-12 h-8 rounded" style={{ background: 'hsl(var(--muted))' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
