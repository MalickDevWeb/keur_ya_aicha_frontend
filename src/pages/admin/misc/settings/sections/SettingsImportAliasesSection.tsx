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
    <section className="mt-8 sm:mt-10">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
            Enregistrer le format
          </Button>
          <Button variant="outline" onClick={onReset} className="w-full sm:w-auto">
            Réinitialiser par défaut
          </Button>
          <Button variant="secondary" onClick={onOpenImport} className="w-full sm:w-auto">
            Ouvrir l'import clients
          </Button>
        </div>
      </div>
    </section>
  )
}
