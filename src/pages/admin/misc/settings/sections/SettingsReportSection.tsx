import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type SettingsReportSectionProps = {
  value: 'csv' | 'xlsx' | 'json'
  onChange: (value: 'csv' | 'xlsx' | 'json') => void
  onSave: () => void
  isSaving: boolean
}

export function SettingsReportSection({ value, onChange, onSave, isSaving }: SettingsReportSectionProps) {
  return (
    <section className="mt-10">
      <h3 className="font-medium">Format du rapport d'import</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Choisissez le format de téléchargement pour la page d'erreurs d'import.
      </p>

      <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Select value={value} onValueChange={(next) => onChange(next as 'csv' | 'xlsx' | 'json')}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Choisir un format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
          Enregistrer
        </Button>
      </div>
    </section>
  )
}
