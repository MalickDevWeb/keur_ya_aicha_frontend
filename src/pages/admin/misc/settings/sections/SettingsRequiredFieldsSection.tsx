import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { ClientImportMapping } from '@/lib/importClients'
import { FIELD_LABELS } from '@/lib/importClients'

type SettingsRequiredFieldsSectionProps = {
  requiredFields: Array<keyof ClientImportMapping>
  isSaving: boolean
  canEdit: boolean
  onToggle: (field: keyof ClientImportMapping) => void
  onSave: () => void
}

const ALL_FIELDS: Array<keyof ClientImportMapping> = [
  'firstName',
  'lastName',
  'phone',
  'cni',
  'email',
  'propertyType',
  'propertyName',
  'startDate',
  'monthlyRent',
  'depositTotal',
  'depositPaid',
  'status',
]

export function SettingsRequiredFieldsSection({
  requiredFields,
  isSaving,
  canEdit,
  onToggle,
  onSave,
}: SettingsRequiredFieldsSectionProps) {
  return (
    <section className="mt-8 sm:mt-10">
      <h3 className="font-medium">Champs obligatoires (Import)</h3>
      <p className="text-sm text-muted-foreground mt-2">
        Ces champs doivent être renseignés lors des imports. Le Super Admin décide, les admins appliquent.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_FIELDS.map((field) => {
          const checked = requiredFields.includes(field)
          return (
            <label
              key={field}
              className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-white/70 px-3 py-2"
            >
              <Checkbox
                checked={checked}
                disabled={!canEdit || isSaving}
                onCheckedChange={() => onToggle(field)}
              />
              <span className="break-words text-sm text-[#121B53]">{FIELD_LABELS[field] || field}</span>
            </label>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {canEdit ? (
          <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        ) : (
          <Button variant="secondary" disabled className="w-full sm:w-auto">
            Définis par Super Admin
          </Button>
        )}
      </div>
    </section>
  )
}
