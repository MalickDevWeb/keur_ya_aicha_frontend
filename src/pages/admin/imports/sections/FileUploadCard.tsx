import { useId } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react'

const JSON_SAMPLE = `[
  {
    "firstName": "Awa",
    "lastName": "Diop",
    "phone": "+221771234567",
    "cni": "1234567890123",
    "email": "awa.diop@example.com",
    "propertyType": "apartment",
    "propertyName": "Appartement F3 Liberté 6",
    "startDate": "2026-03-01",
    "monthlyRent": 150000,
    "depositTotal": 300000,
    "depositPaid": 150000,
    "status": "active"
  }
]`

const CSV_SAMPLE = `firstName,lastName,phone,cni,email,propertyType,propertyName,startDate,monthlyRent,depositTotal,depositPaid,status
Awa,Diop,+221771234567,1234567890123,awa.diop@example.com,apartment,Appartement F3 Liberté 6,2026-03-01,150000,300000,150000,active`

type FileUploadCardProps = {
  fileName: string
  requiredFields: string[]
  optionalFields: string[]
  isReadingFile?: boolean
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function FileUploadCard({
  fileName,
  requiredFields,
  optionalFields,
  isReadingFile = false,
  onFileChange,
}: FileUploadCardProps) {
  const fileInputId = useId()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Charger un fichier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          id={fileInputId}
          type="file"
          accept=".xlsx,.csv,.json,application/json,text/csv"
          onChange={onFileChange}
          className="sr-only"
          disabled={isReadingFile}
        />

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Button asChild variant="outline" className="w-full md:w-auto whitespace-normal text-center" disabled={isReadingFile}>
            <label htmlFor={fileInputId} className="cursor-pointer">
              {isReadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isReadingFile ? 'Lecture du fichier...' : 'Choisir un fichier'}
            </label>
          </Button>
          <p className="min-w-0 text-sm text-muted-foreground break-all">
            {fileName || 'Aucun fichier sélectionné'}
          </p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-3 text-sm">
          <p className="font-medium text-blue-900">Guide rapide pour l’admin</p>
          <p className="text-blue-900/90">
            Formats acceptés: Excel <strong>.xlsx</strong>, CSV <strong>.csv</strong>, JSON <strong>.json</strong>.
            L’ordre des colonnes est libre grâce au mapping.
          </p>
          <div className="space-y-1 rounded-md bg-white/70 p-3">
            <p className="text-blue-900/90">
              <strong>Champs obligatoires:</strong> {requiredFields.join(', ') || 'Aucun'}
            </p>
            <p className="text-blue-900/90">
              <strong>Champs optionnels:</strong> {optionalFields.join(', ') || 'Aucun'}
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-md border border-blue-200 bg-white/80 p-2">
              <p className="font-medium text-blue-900">Format des données</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-blue-900/90">
                <li>Téléphone: <code>+221771234567</code> ou <code>771234567</code></li>
                <li>CNI: 13 chiffres, exemple <code>1234567890123</code></li>
                <li>Date: <code>YYYY-MM-DD</code> conseillé, exemple <code>2026-03-01</code></li>
                <li>Montants: nombres simples, exemple <code>150000</code></li>
                <li>Statut: <code>active</code>, <code>archived</code> ou <code>blacklisted</code></li>
              </ul>
            </div>
            <div className="rounded-md border border-blue-200 bg-white/80 p-2">
              <p className="font-medium text-blue-900">Étapes simples</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-blue-900/90">
                <li>Chargez le fichier Excel, CSV ou JSON.</li>
                <li>Associez les colonnes obligatoires dans “Mapping”.</li>
                <li>Analysez les erreurs puis importez les lignes valides.</li>
              </ol>
            </div>
          </div>

          <details className="rounded-md border border-blue-200 bg-white/80 p-2">
            <summary className="cursor-pointer font-medium text-blue-900">Exemple CSV</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-slate-900 p-2 text-xs text-slate-100">
              {CSV_SAMPLE}
            </pre>
          </details>

          <details className="rounded-md border border-blue-200 bg-white/80 p-2">
            <summary className="cursor-pointer font-medium text-blue-900">Exemple JSON</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-slate-900 p-2 text-xs text-slate-100">
              {JSON_SAMPLE}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
