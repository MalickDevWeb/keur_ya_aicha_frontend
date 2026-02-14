import { AlertTriangle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePagination } from '@/hooks/usePagination'
import { useSearch } from '@/hooks/useSearch'
import type { StoredErrors } from '@/services/importErrors'

interface ErrorsTableProps {
  storedErrors: StoredErrors['errors']
  inserted?: StoredErrors['inserted']
}

/**
 * Component for displaying import errors in table format
 * Extracted from ImportErrors.tsx for reusability
 */
export function ErrorsTable({ storedErrors, inserted }: ErrorsTableProps) {
  const { query, setQuery, filtered } = useSearch(storedErrors, (error, q) => {
    const fname = error.parsed.firstName?.toLowerCase() || ''
    const lname = error.parsed.lastName?.toLowerCase() || ''
    const phone = error.parsed.phone?.toLowerCase() || ''
    const email = error.parsed.email?.toLowerCase() || ''
    return fname.includes(q) || lname.includes(q) || phone.includes(q) || email.includes(q)
  })

  const { data: paginatedErrors, page, setPage, totalPages, hasNext, hasPrev } = usePagination(filtered, 20)

  const successCount = (inserted?.length || 0) + storedErrors.filter((e) => !e.errors.length).length
  const errorCount = storedErrors.filter((e) => e.errors.length > 0).length

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Rechercher par nom, téléphone..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          className="max-w-sm"
        />
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{successCount}</span> importés ✓ |
          <span className="font-semibold ml-2">{errorCount}</span> erreurs ✗
        </div>
      </div>

      {paginatedErrors.length > 0 ? (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="max-w-xs">Erreurs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedErrors.map((error, idx) => (
                  <TableRow key={idx} className={error.errors.length > 0 ? 'bg-red-50' : 'bg-green-50'}>
                    <TableCell className="font-mono text-sm">{error.rowNumber}</TableCell>
                    <TableCell>
                      {error.parsed.firstName} {error.parsed.lastName}
                    </TableCell>
                    <TableCell>{error.parsed.phone}</TableCell>
                    <TableCell>{error.parsed.email}</TableCell>
                    <TableCell className="text-sm">
                      {error.errors.length > 0 ? (
                        <div className="space-y-1">
                          {error.errors.map((err, i) => (
                            <div key={i} className="flex gap-2 text-red-700">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-700">✓ Valide</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <Button onClick={() => setPage(page - 1)} disabled={!hasPrev} variant="outline">
                Précédent
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} sur {totalPages}
              </span>
              <Button onClick={() => setPage(page + 1)} disabled={!hasNext} variant="outline">
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucune erreur trouvée</p>
        </div>
      )}
    </div>
  )
}
