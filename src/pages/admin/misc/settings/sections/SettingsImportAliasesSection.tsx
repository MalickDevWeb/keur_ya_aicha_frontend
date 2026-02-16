import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type SettingsImportAliasesSectionProps = {
  value: string
  error: string
  isSaving: boolean
  onChange: (value: string) => void
  onSave: () => void
  onReset: () => void
  onOpenImport: () => void
}

export function SettingsImportAliasesSection({
  value,
  error,
  isSaving,
  onChange,
  onSave,
  onReset,
  onOpenImport,
}: SettingsImportAliasesSectionProps) {
  return (
    <section className="mt-10">
      <h3 className="font-medium">Format d'import Excel</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Définissez votre format d'import (par admin). Exemple: si votre fichier contient "CN1", ajoutez-le dans la
        liste de <span className="font-medium">cni</span>.
      </p>

      <div className="mt-4 space-y-3">
        <Textarea
          rows={10}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="JSON d'alias des colonnes"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={onSave} disabled={isSaving}>
            Enregistrer le format
          </Button>
          <Button variant="outline" onClick={onReset}>
            Réinitialiser par défaut
          </Button>
          <Button variant="secondary" onClick={onOpenImport}>
            Ouvrir l'import clients
          </Button>
        </div>
      </div>
    </section>
  )
}
