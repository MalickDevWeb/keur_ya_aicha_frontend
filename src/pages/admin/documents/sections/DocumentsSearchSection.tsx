import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type DocumentsSearchSectionProps = {
  value: string
  total: number
  onChange: (value: string) => void
}

export function DocumentsSearchSection({ value, total, onChange }: DocumentsSearchSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Search className="w-5 h-5 text-blue-600" />
          Rechercher des documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nom, prénom ou téléphone du client..."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 pl-10 text-sm sm:text-base"
          />
        </div>
        {value && (
          <div className="mt-3 text-xs text-muted-foreground sm:text-sm">
            <strong>{total}</strong> document(s) trouvé(s) pour "{value}"
          </div>
        )}
      </CardContent>
    </Card>
  )
}
