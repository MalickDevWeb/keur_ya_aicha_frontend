import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import type { ClientImportError } from '@/lib/importClients'

interface ImportClientsErrorsSectionProps {
  errors: ClientImportError[]
  isLoading?: boolean
  onImport?: () => Promise<void>
  onClose?: () => void
}

/**
 * Errors section for import clients
 * Displays validation errors before import
 */
export function ImportClientsErrorsSection({
  errors,
  onClose,
}: ImportClientsErrorsSectionProps) {
  if (errors.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <div className="text-xl">✓</div>
            <div>
              <p className="font-medium">Aucune erreur détectée</p>
              <p className="text-sm">Vous pouvez procéder à l'importation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {errors.length} Erreur(s) détectée(s)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-64 overflow-y-auto space-y-2">
          {errors.slice(0, 10).map((error, idx) => (
            <div key={idx} className="p-2 bg-white rounded border border-red-200 text-sm">
              <p className="font-medium text-red-700">Ligne {error.rowNumber}</p>
              {error.errors.map((msg, eIdx) => (
                <p key={eIdx} className="text-red-600 text-xs ml-2">
                  • {msg}
                </p>
              ))}
            </div>
          ))}
          {errors.length > 10 && (
            <p className="text-xs text-gray-600 text-center py-2">
              ... et {errors.length - 10} autre(s) erreur(s)
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Retour
            </Button>
          )}
          <Button disabled className="flex-1">
            Corriger les erreurs d'abord
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
